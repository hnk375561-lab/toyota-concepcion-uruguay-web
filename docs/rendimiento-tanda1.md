# Rendimiento — tanda 1: ruta crítica

## Alcance

Se aplicaron optimizaciones acotadas de ruta crítica sobre `main`, sin tocar datos de negocio, modo DEMO, `noindex`, canonical, `og:url` ni funcionalidad visible. El ZIP solicitado contiene solamente archivos modificados o agregados en esta sesión.

## Cambios aplicados

| Cambio | Resultado verificable |
|---|---|
| Preloads del hero | Se conservaron los dos preloads ya corregidos en `main`: móvil con `media="(max-width: 760px)"` y escritorio con `media="(min-width: 761px)"`. |
| Logo del header | `enhanced-bec83be10e47.webp` de 38.262 bytes reemplazado por `asset-bec83be10e47-256.webp` de 15.010 bytes: ahorro de 23.252 bytes, 60,8%, sin cambiar el tamaño CSS de 38 px. |
| Fuentes | Se eliminaron Google Fonts y sus preconnects. Se agregaron ocho variantes WOFF2 latinas self-hosted, `font-display: swap`, dos preloads tipográficos y licencia OFL. |
| Lenis | Se eliminó `document.write` y se dejó un único cargador bajo demanda: no se carga en `pointer: coarse` ni con reduced motion; en escritorio se carga en idle tras `load` y luego invoca `window.__initToyotaLenis()`. |
| Fallback tipográfico | Se agregaron metric overrides para reducir saltos durante el swap. |

## Hashes de `index.html`

- Antes, `main`: `e611edce6dc50b8f86f0706e423bf23157d2a34093f910dc26fa09732f908eed`
- Después: `84974b0f8cf3eb40aa84b624db8f6feb539f83dba2e7e145fea186fcc35a2932`

El hash final cambia respecto de la primera entrega porque esta tanda agrega el self-hosting de fuentes y el cargador condicional de Lenis.

## Mediciones reproducibles

`scripts/perf-benchmark.py` ejecutó cinco corridas móviles en Chromium local. Resultado mediano: **FCP 216 ms**, **CLS 0**, **15 requests**, **859.038 bytes de `Content-Length`**, **2.753 nodos DOM**. El benchmark local no produjo una entrada LCP confiable (`null` en las cinco corridas), por lo que no se afirma una mejora de LCP. Tampoco se presenta este valor como Lighthouse: para una comparación de carga transferida comprimida hace falta repetirlo con un servidor gzip/Brotli o Lighthouse contra la URL pública.

## Validaciones

- `scripts/qa-critical-route.py`: verde en 390 px touch y 1280 px escritorio; fuentes locales cargadas; Lenis ausente en touch y presente bajo demanda en escritorio; logo correcto; cero errores de consola y requests fallidos.
- `scripts/validate-assets.py`: verde; 97 rutas locales, 0 faltantes; todos los assets decodifican.
- `scripts/check-business-data.py`: verde; tel 5/5, WhatsApp 20/20, mails 1/1, precios 5/5, horarios 4/4 y direcciones 5/5 sin diferencias.
- `git diff --check`: verde.
- Compilación sintáctica de todos los scripts nuevos: verde.

La batería preexistente `scripts/qa-smoke.py` del repositorio no es ejecutable sobre el estado original porque intenta leer `link[rel="canonical"]`, selector que no existe en `main`; el canonical no fue agregado ni modificado, respetando la regla DEMO.

## Probados y no declarados como logrados

No se declara Lighthouse Performance, LCP, TBT, Speed Index, waterfall comprimido, diff de píxeles en seis anchos ni comparación de cinco medianas antes/después porque no se obtuvo una ejecución Lighthouse válida en esta tanda. El benchmark reproducible deja los datos disponibles para la siguiente tanda y registra explícitamente las métricas no disponibles.
