# QA de interactividad — Fase 3

## Resultado ejecutivo

El congelamiento al hacer clic en imágenes no se reprodujo en la URL pública ni en local con Chromium a 390×844. Tampoco se reprodujo el fallo de filtros de gama: los cuatro filtros produjeron las cantidades esperadas tanto en producción como en local. Por no existir un fallo reproducible, no se aplicó un parche cosmético ni se modificaron `index.html` o los manejadores existentes.

La URL pública se probó con parámetro anti-caché. En ambos entornos hubo 0 `pageerror`, 0 `console.error` y 0 overflow horizontal en 390×844 y 1440×900. Se observaron 7 warnings GSAP del tipo `scale not eligible for reset. Try splitting into individual properties`; no son errores y no se alteraron porque el pedido prohíbe corregir aspectos no relacionados sin reproducción.

## Evidencia del congelamiento

| Entorno | `html/body` | Overlay o diálogo activo | `elementFromPoint` | Lenis | Resultado |
|---|---|---|---|---|---|
| Público Chromium 390×844 | `overflow: clip visible`, `position: static` | `#modelDetail` display `none`, sin overlay abierto | Botón de filtro, no overlay | Existe; `isStopped=false` | PASS: no congelamiento reproducido |
| Local Chromium 390×844 | `overflow: clip visible`, `position: static` | `#modelDetail` display `none`, sin overlay abierto | Botón de filtro, no overlay | Existe; `isStopped=false` | PASS: no congelamiento reproducido |

También se registró `scrollY=11875` después del clic de prueba, sin `overflow:hidden`, sin `position:fixed` y sin error de página. No hubo requests fallidos de los recursos observados durante estas corridas.

Las hipótesis E1(a–g) no pudieron confirmarse como causa del síntoma porque el síntoma no apareció: no quedó Lenis detenido, no quedaron estilos de bloqueo, no hubo overlay invisible, no hubo excepción, y público/local mostraron el mismo comportamiento. Un `git bisect` de regresión no es concluyente sin un test que falle en un extremo; el test actual pasa en el estado base de prueba operativa y en HEAD.

## Inventario F0

El script `scripts/qa-interactividad.py` enumeró **246 elementos interactivos** en el estado publicado, incluyendo enlaces, botones, selectores, rangos, filtros, motivos del formulario, FAQ y controles de navegación. El JSON contiene para cada elemento selector, sección, etiqueta, href y efecto esperado.

## F1/F2: filtros de gama

| Entorno | Viewport | Todos | Pick-ups | SUV | Sedanes | Errores |
|---|---:|---:|---:|---:|---:|---:|
| Público Chromium | 390×844 | 9/9 | 1/1 | 5/5 | 3/3 | 0 `console.error`, 0 `pageerror` |
| Público Chromium | 1440×900 | 9/9 | 1/1 | 5/5 | 3/3 | 0 `console.error`, 0 `pageerror` |
| Local Chromium | 390×844 | 9/9 | 1/1 | 5/5 | 3/3 | 0 `console.error`, 0 `pageerror` |
| Local Chromium | 1440×900 | 9/9 | 1/1 | 5/5 | 3/3 | 0 `console.error`, 0 `pageerror` |

El filtro actual usa `data-filter` y `data-tipo` coincidentes (`todos`, `pickup`, `suv`, `sedan`), adjunta el handler sobre `#filterbar` después de renderizar `#gama-grid`, aplica `hidden` a las tarjetas y actualiza el hash. La evidencia no confirma la hipótesis de selector, orden de ejecución o re-render como causa común.

## Matriz resumida

| Área | Chromium público 390/1440 | Firefox | WebKit | Motivo |
|---|---|---|---|---|
| Carga, consola, pageerror, overflow | PASS | NO VERIFICADO | NO VERIFICADO | Firefox/WebKit no se ejecutaron por dependencias del sistema faltantes en la VM |
| Filtros de gama | PASS, 9/1/5/3 | NO VERIFICADO | NO VERIFICADO | No se simularon motores alternativos |
| Imágenes y cierre posterior | PASS para el ciclo de imágenes enumeradas de gama | NO VERIFICADO | NO VERIFICADO | El clic no abrió modal; no quedó bloqueo |
| Menú móvil y dropdowns | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Inventariados, no se completó la matriz individual |
| Accesorios, FAQ, carrusel y orden | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Sin ejecución exhaustiva |
| Comparador y cotizador | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Sin ejecución exhaustiva |
| Formularios/enlaces sensibles | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Se interceptaron destinos; no se enviaron mensajes |

Firefox y WebKit fueron descargados, pero Playwright reportó dependencias faltantes (`libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libatomic.so.1`, `libevent-2.1.so.7`, `libavif.so.16`, `libwayland-server.so.0`, `libmanette-0.2.so.0`, `libenchant-2.so.2`, `libsecret-1.so.0`). No se simularon esos motores.

## Defectos no corregidos

El síntoma reportado por el usuario no se reprodujo en esta sesión; por eso no hay causa raíz confirmada ni corrección de código que pueda justificarse. Los warnings GSAP quedaron reportados y no corregidos porque no producen error observable en las pruebas y no son la causa demostrada del congelamiento.

La auditoría exhaustiva F1 de cada uno de los 246 elementos en tres motores y todos los viewports queda **NO VERIFICADA**; el script entregado cubre inventario y regresión dirigida de filtros/imágenes en Chromium.
