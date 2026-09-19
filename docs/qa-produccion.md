# QA en producción — Fase 2

## Alcance y precondición

La URL pública se verificó con parámetro anti-caché el 19 de septiembre de 2026: HTTP 200, meta `robots` con `noindex, nofollow, noarchive, nosnippet`, ausencia de `rel="canonical"` y nueve filas `Precio` con el texto solicitado. La publicación pública corresponde a la Fase 1; los commits de esta Fase 2 no fueron publicados porque la regla indica hacer merge y push únicamente después de que todas las verificaciones pasen.

Las verificaciones Chromium se ejecutaron contra la URL pública con un contexto Playwright y capturas en `/tmp/fase2-qa/`. Los enlaces `wa.me`, `tel:` y `mailto:` fueron interceptados; no se enviaron mensajes, llamadas ni correos.

## Matriz de pruebas

| Prueba | Chromium producción | Firefox producción | WebKit producción | Observación |
|---|---|---|---|---|
| T1 HTTP 200, pageerror, console.error, overflow | PASS en 9 viewports | NO VERIFICADO | NO VERIFICADO | Chromium: HTTP 200, 0 `pageerror`, 0 `console.error`, 0 overflow en 320×568, 360×740, 390×844, 412×915, 768×1024, 1024×768, 1280×720, 1440×900 y 1920×1080. |
| T2 imágenes después de scroll total | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | La corrida inicial no hizo scroll completo; las imágenes lazy con `naturalWidth=0` no permiten concluir un defecto. |
| T3 enlaces y GET externos | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | No se ejecutó el GET único por enlace externo. |
| T4 menú, dropdowns y navegación móvil | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Sin ejecución completa. |
| T5 filtros, FAQ, carrusel y sliders | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | E3 sí tuvo comparación visual específica. |
| T6 comparador, 72 pares y hash directo | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Sin matriz completa de pares. |
| T7 cotizador y fórmula francesa | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | Sin extracción/recalculo completo. |
| T8 formularios y motivos | NO VERIFICADO en producción | NO VERIFICADO | NO VERIFICADO | E1/E2 se probaron localmente contra el checkout de Fase 2; aún no están publicados. |
| T9 accesibilidad y teclado | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO | No se instaló axe-core ni se completó la matriz de foco. |

Firefox 153 y WebKit 26.5 se descargaron, pero Playwright reportó dependencias de sistema faltantes (`libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libatomic.so.1`, `libevent-2.1.so.7`, `libavif.so.16`, `libwayland-server.so.0`, `libmanette-0.2.so.0`, `libenchant-2.so.2` y `libsecret-1.so.0`). No se simularon esos motores.

## Extras E1–E4

E1 quedó verificado localmente: `maxlength` real de `#cName=80`, `#cMsg=500`, `#tradeCar=60` y `#tradeKm=7`. Con `press_sequentially`, `#cMsg` retuvo longitud JavaScript 500 con 600 `ñ` y 500 con 600 emojis.

E2 quedó verificado localmente con `window.open=()=>null`: los formularios de usados, tasación y contacto navegaron a URLs `https://wa.me/5493442473453?...`. El popup normal se abrió para los tres formularios; el navegador siguió el redirect a `api.whatsapp.com`, por lo que el resultado observado después de la navegación fue esa URL de destino. La rehabilitación del botón a los aproximadamente 3 segundos no fue medida en esta corrida.

E3 se comparó a 390×844 mediante captura de `#faqList` antes y después. Las capturas fueron de 358×1023 y tuvieron 0 píxeles diferentes, equivalente a 0,0% de diferencia.

E4 se verificó visualmente: `apple-touch-icon.png` mide 180×180, `favicon-32.png` mide 32×32, ambos son RGB con fondo blanco y el logo es legible sin recorte visible.

## Tabla de enlaces sensibles para confirmar por área

| Enlace | Etiqueta visible cercana | Número |
|---|---|---|
| `tel:+543442473453` | Turnos de service | `+543442473453` |
| `tel:+543442677433` | Repuestos | `+543442677433` |
| `tel:+543442502390` | Neumáticos | `+543442502390` |
| `https://wa.me/5493442473453?...` | Hablar por WhatsApp / ventas / service | `5493442473453` |
| `https://wa.me/5493442677433?...` | Repuestos / accesorios | `5493442677433` |
| `https://wa.me/5493442502390?...` | Neumáticos | `5493442502390` |

Los enlaces externos a Instagram, Google Maps, Apple Maps y Toyota Argentina quedaron **NO VERIFICADOS** porque no se ejecutó el GET único permitido para cada uno.

## Defectos no corregidos

Las imágenes lazy no cargadas antes del scroll total quedaron **NO VERIFICADAS**, no corregidas, porque la captura inicial no cumplió la condición de scroll requerida. No se modificaron filtros, navegación, accesibilidad, comparador, cotizador ni enlaces existentes.

Estos resultados son una emulación de navegadores y viewports, no equivalen a un iPhone o Android físico.
