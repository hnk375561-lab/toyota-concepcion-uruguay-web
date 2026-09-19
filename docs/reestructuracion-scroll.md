# Fase 5 — Reestructuración del scroll

## Estado de la entrega

La implementación se realizó en la rama local `fase5`, partiendo del tag `pre-fase5` sobre el commit `664518eaaaab2f9bf6a2b1bb9f40638638c7fafb`. La puerta de entrada `scripts/qa-congelamiento.py` fue ejecutada antes de modificar el sitio y terminó con **8 casos y 0 fallos**. La repetición posterior también terminó con **8 casos y 0 fallos**.

No se hizo merge fast-forward a `main` ni push a GitHub porque los criterios V7 de Lighthouse y V8 sobre la URL pública no fueron ejecutados en esta sesión. El ZIP se entrega como paquete parcial de archivos modificados, no como una afirmación de aceptación final.

## Mapa de la reestructura

| Sección original | Ubicación final | Estado |
|---|---|---|
| Hero | `main`, antes de los bloques nuevos | Conservada |
| `ubicacion` | `#contacto-y-ubicacion`; `.location-status` fue movido a `#accesos-rapidos` | Conservada y reubicada |
| `accesorios` | `#postventa`, pestaña Accesorios | Conservada y reubicada |
| `neumaticos` | `#postventa`, pestaña Neumáticos | Conservada y reubicada |
| `taller` | `#postventa`, pestaña Taller y mantenimiento | Conservada y reubicada |
| `gama` | Después de `#accesos-rapidos` | Conservada y subida |
| `destacados` | `docs/secciones-retiradas.md` | Retirada; era redundante |
| `novedades` | `#comprar`, pestaña Promociones | Conservada y reubicada |
| `servicios-adicionales` | `docs/secciones-retiradas.md` | Retirada; enlaces retargeteados |
| `contacto-ampliado` | Enlaces y tarjetas únicas pasaron a `#contacto`; HTML completo archivado | Retirada |
| `porque` | `#nosotros`, pestaña Por qué elegirnos | Conservada y reubicada |
| `categorias` | Tarjetas reutilizadas en `#accesos-rapidos`; HTML completo archivado | Retirada; contenido funcional trasladado |
| `como-comprar` | `#comprar`, pestaña Cómo comprar | Conservada y reubicada |
| `formas-de-pago` | `#comprar`, junto a Cómo comprar | Conservada y reubicada |
| `vistos` | `docs/secciones-retiradas.md`; sus anclas apuntan a `#gama` | Retirada; redundante |
| `usados` | `#comprar`, pestaña Usados | Conservada y reubicada |
| `canje` | `#comprar`, pestaña Plan canje | Conservada y reubicada |
| `financiacion` | `#comprar`, pestaña Financiar | Conservada y reubicada |
| `mantenimiento` | `#postventa`, junto a Taller | Conservada y reubicada |
| `servicios` | `#postventa`, pestaña Service | Conservada y reubicada |
| `repuestos` | `#postventa`, pestaña Repuestos | Conservada y reubicada |
| `instalaciones` | `#nosotros`, junto a Concesionario | Conservada y reubicada |
| `testimonios` | `#nosotros`, pestaña Opiniones | Conservada y reubicada |
| `faq` | Después de `#nosotros` | Conservada |
| `contacto` | `#contacto-y-ubicacion`, junto a Ubicación | Conservada y reubicada |
| `galeria-google-maps` | `#nosotros`, pestaña Galería | Conservada y reubicada entera |
| `concesionario` | `#nosotros`, junto a Instalaciones | Conservada y reubicada |
| Banner CTA | Después de `#contacto-y-ubicacion` | Contenido conservado |

Los nuevos bloques son `#accesos-rapidos`, `#comprar`, `#postventa`, `#nosotros` y `#contacto-y-ubicacion`. El comparador permanece dentro de `#gama`, pero ahora se muestra mediante un disclosure cerrado por defecto y se abre con `#comparar`.

## Navegación y comportamiento

Se retargetearon las anclas `#categorias`, `#destacados` y `#vistos` hacia `#gama`; `#servicios-adicionales` hacia `#comprar`; y `#contacto-ampliado` hacia `#contacto`. La implementación compartida de pestañas usa `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`, `hidden`, navegación circular con flechas, `Home`, `End`, `tabindex` roving y scroll horizontal de la barra a 320 px. Los cambios de pestaña usan `history.replaceState` y una única llamada agrupada a `ScrollTrigger.refresh()` dentro de `requestAnimationFrame`.

## Medición antes/después

La medición se ejecutó con Chromium, `prefers-reduced-motion: no-preference`, mouse fino, CDN disponibles y cuatro viewports. Las capturas full-page y los JSON crudos se guardaron fuera del repositorio.

| Viewport | ScrollHeight antes | ScrollHeight después | Pantallas antes | Pantallas después | Secciones DOM antes/después | ScrollTriggers antes/después |
|---|---:|---:|---:|---:|---:|---:|
| 390×844 | 54.052 | 23.518 | 64,04 | 27,86 | 28 / 28 | 82 / 18 |
| 768×1024 | 38.276 | 17.339 | 37,38 | 16,93 | 28 / 28 | 82 / 18 |
| 1440×900 | 28.355 | 12.086 | 31,51 | 13,43 | 28 / 28 | 82 / 18 |
| 1920×1080 | 28.638 | 12.250 | 26,52 | 11,34 | 28 / 28 | 82 / 18 |

La consulta de secciones cuenta también las secciones originales anidadas dentro de paneles; por eso no baja. La reducción del scroll sí fue medida: aproximadamente 56,5 % en 390×844, 54,7 % en 768×1024, 57,4 % en 1440×900 y 57,2 % en 1920×1080.

## Verificación ejecutada

| Criterio | Resultado | Alcance y evidencia |
|---|---|---|
| V1 Estructura | PASS parcial | IDs únicos; nuevos IDs presentes; cinco IDs retirados ausentes; orden DOM validado. |
| V2 Anclas | PASS parcial | 96 anclas internas resolvieron estáticamente; hashes `#repuestos` y `#galeria-google-maps` activaron la pestaña correcta; comparador probado con hash. |
| V3 Pestañas | PASS | ARIA, un panel visible por bloque, clicks, `Home`, `End`, hashes y overflow horizontal a 320 px verificados. |
| V4 Funcionalidad | PASS parcial | `qa-interactividad.py`: 390×844 y 1440×900, filtros 9/1/5/3, 0 `console.error`, 0 `pageerror`, sin overflow. Smoke adicional de pestañas y comparador PASS. |
| V5 Congelamiento | PASS en el script disponible | 8 casos en Chromium, Firefox y WebKit; 200 ciclos por caso; `failed: 0`. Las advertencias observadas ya estaban presentes en la línea base; no hubo `pageerror`. |
| V6 Consola | PASS parcial | No hubo errores de página ni errores de consola en la batería funcional. El script `qa-smoke.py` no pudo avanzar porque exige un `<link rel="canonical">` ausente también en `pre-fase5`. |
| V7 Medición | PASS parcial | Reducción de scroll medida y capturas tomadas. Lighthouse móvil mediana de tres corridas: **NO VERIFICADO**. LCP/CLS/TBT: **NO VERIFICADO**. |
| V8 Pública | NO VERIFICADO | No se publicó ni se hizo push; por lo tanto no se verificó la URL pública. |

El stress test reportó advertencias repetidas de GSAP (`scale not eligible for reset`) y advertencias de preload/scroll-linked positioning. Se observaron también en la línea base; no fueron introducidas por la reestructura según la comparación cruda de ambos JSON.

## Colores y fondos

No se detectaron líneas modificadas en el diff de `index.html` que contengan declaraciones existentes de `background`, `color`, `gradient` o variables de fondo. El CSS agregado para pestañas y accesos usa variables existentes (`--surface`, `--ink`, `--panel`, `--border`, `--motion-ui`) y no introduce valores de color nuevos.

## Límites conocidos

La reestructura se validó localmente. No se ejecutaron Lighthouse, Edge (`msedge`) ni la matriz completa de carga/hash sobre la URL pública. Tampoco se hizo merge/push por esos pendientes. El paquete no incluye assets porque no se modificaron imágenes ni dependencias.

## Archivos incluidos

`index.html` contiene la estructura y comportamiento Fase 5. `docs/secciones-retiradas.md` conserva el HTML completo de las cinco secciones retiradas. Este informe documenta las mediciones y los límites de verificación.
