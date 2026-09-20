# Segunda pasada adversarial — revisión y evidencia

## Línea base y alcance

La segunda pasada se ejecutó sobre el `index.html` ya modificado. El detector Playwright recorrió **170 configuraciones**: todos los anchos de 320 a 1920 px en pasos de 10 px, más los nueve anchos críticos solicitados. En cada medición se forzó la visibilidad de `.premium-reveal` antes de medir.

El detector registró **0 errores de consola** y **0 respuestas HTTP 4xx/5xx**. La métrica de overflow del documento no reportó desbordamiento horizontal del viewport en la navegación Chromium. El script reproducible quedó en `scripts/qa-adversarial-second-pass.js` y la salida completa de la corrida se guardó en el sandbox como `toyota-second-audit.json`.

## Hallazgos revisados

| Detector | Resultado bruto | Evaluación | Acción |
|---|---:|---|---|
| Overflow de elementos | Máximo 19 elementos por ancho | Los ejemplos son rieles, tabs y elementos dentro de contenedores de scroll/clip; no implican overflow horizontal del documento. | No se agregó un override genérico que pudiera romper los carruseles. |
| Texto con scroll recortado | 19 elementos máximo | Corresponde principalmente a imágenes, FAQ cerrables, mapa e imagen de fachada con `overflow:hidden` intencional. | No reproduce como texto cortado visible. |
| Columnas menores de 140 px | Detectadas | Incluye rieles editoriales, chips, escalas y cards diseñados para densidad; no la dirección principal de ubicación. | No reproduce el bug de dirección partida. |
| Áreas táctiles | Detectadas en links compactos | El detector incluye links decorativos/inline y elementos de navegación compacta; requiere una revisión de diseño específica antes de aplicar `min-height:44px` global. | Requiere decisión de diseño; no se cambió toda la tipografía inline. |
| Elementos tapados | 4 inicialmente | Eran los links de la mobilebar oculta (`opacity:0`, `pointer-events:none`); al forzar `.mobilebar.is-visible`, el resultado fue 0. | Falso positivo documentado. |
| Botones casi cuadrados | Detectados | Los casos visibles corresponden a los botones circulares del selector de plazo y a un CTA de dos líneas; el texto cabe y no se corta. | No reproduce el bug de botones de ubicación. |
| Consola y red | 0 / 0 | No se observaron errores durante la navegación Chromium. | Corregido / verificado. |

## Revisión visual por zonas prioritarias

Las capturas comparativas de `#ubicacion` y `#contacto` en 360, 830, 1024 y 1600 px se encuentran bajo `evidence/` en el paquete de la primera pasada. En esta segunda pasada no se encontró un defecto reproducible nuevo en esas zonas con Chromium: los botones de ubicación conservan texto completo, el mapa ocupa su columna, el bloque de marca usa estadísticas en grilla y el panel de contacto mantiene su ancho dentro del viewport.

La barra móvil debe evaluarse con su estado visible real; una captura tomada antes de que el scroll la active puede dejarla invisible, y no representa una superposición del sitio.

## Limitaciones

La ejecución disponible fue Chromium local. WebKit y Firefox no estaban instalados en el sandbox. Los detectores de contraste, OCR visual y Lighthouse no se sustituyeron por afirmaciones; no se declara cumplimiento de esos puntos sin una corrida específica. Los datos de negocio no se modificaron.
