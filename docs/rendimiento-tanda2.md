# Rendimiento — tanda 2: imágenes y trabajo bajo pliegue

## Cambios planeados y aplicados

La Tanda 2 se definió sobre las tareas pendientes del brief: reducir el peso de imágenes referenciadas, aprovechar variantes responsive modernas, diferir trabajo no crítico y quitar hints de pintado permanentes sin modificar contenido ni comportamiento.

| Cambio | Aplicación |
|---|---|
| Variantes AVIF de imágenes grandes | Se generaron 48 variantes AVIF nuevas para imágenes WebP referenciadas, conservando WebP como fallback y las mismas dimensiones, `alt`, `sizes` y `srcset`. La galería incorporó una fuente AVIF antes de WebP. |
| Responsive images | Las galerías existentes mantienen 480/800/1440 según disponibilidad; el navegador puede seleccionar AVIF con el mismo `sizes`, evitando descargar 1440 px en móviles. |
| Barrido de SVG no crítico | El marcado decorativo de SVG y `.contact-plus-icon` se difiere a `requestIdleCallback` con fallback a `setTimeout`, sin tocar el listener de tracking ni el contenido accesible con `aria-label`. |
| Pintado | Se eliminó el `will-change: transform` permanente del vehículo editorial y se dejó `will-change: auto`; las reglas existentes `will-change: opacity,transform` solo quedan donde ya se usan para animaciones concretas. |

## Verificación

- `validate-assets.py`: **verde**, 145 referencias locales y 0 faltantes; los AVIF decodifican correctamente.
- `qa-critical-route.py`: **verde** en 390 px touch y 1280 px escritorio; cero errores de consola y red, fuentes locales cargadas, Lenis ausente en touch y activo bajo demanda en escritorio.
- `check-business-data.py`: **verde**, sin diferencias en teléfonos, WhatsApp, mails, precios, horarios ni direcciones.
- `git diff --check`: **verde**.
- Benchmark móvil de cinco corridas: FCP mediano **212 ms**, CLS mediano **0**, **15 requests**, **863.538 bytes** de `Content-Length`, **2.770 nodos DOM**. LCP no produjo una entrada confiable en este runner local y queda explícitamente como `null`; no se afirma mejora de LCP sin Lighthouse o una traza CDP válida.

## Ahorro de assets

Como referencia del conjunto de pares AVIF/WebP disponible en `toyota-sharp-assets`, 118 pares suman 15.192.186 bytes en WebP frente a 9.839.189 bytes en AVIF: 5.352.997 bytes menos, equivalente a 35,2%. La cifra incluye variantes AVIF que ya existían antes de esta tanda; las 48 nuevas variantes se generaron solo cuando AVIF quedó más liviano que su WebP correspondiente.

## No aplicado en esta tanda

No se aplicó `content-visibility: auto` sobre secciones con anchors porque puede modificar alturas iniciales y el aterrizaje exacto de `#gama`, `#ubicacion` y otros destinos; requiere capturas full-page y validación de scroll específica. Tampoco se externalizó el bloque principal de JS/CSS inline: hacerlo sin una etapa de build y diff de píxeles completa sería más riesgoso que beneficioso en este HTML monolítico.

## Hashes

El HTML conserva el cambio de Tanda 1 y agrega las mejoras de Tanda 2. SHA-256 final: `ec105344ee60d300f0fd9f745394ef692cd85f67ee8224bca2e794c78af3fb38`.
