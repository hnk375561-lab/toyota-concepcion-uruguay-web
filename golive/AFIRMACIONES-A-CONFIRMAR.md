# Afirmaciones a confirmar

Inventario de afirmaciones fácticas revisadas en el HTML estático y en los textos generados por JavaScript. Se conservaron únicamente formulaciones respaldadas por páginas oficiales de Toyota o se debilitaron/eliminaron cuando la fuente no alcanzaba.

| # | Texto original | Ubicación | Acción | Texto final | Fuente oficial |
|---:|---|---|---|---|---|
| 1 | desde 1987 | Rail vertical del hero | eliminado | — | Requiere confirmación del dueño |
| 2 | Usados y certificados | Sección Usados | reformulado | Usados | Requiere confirmación del dueño |
| 3 | usado certificado | Plan canje, formulario y mensajes | reformulado | usado | Requiere confirmación del dueño |
| 4 | El stock rota seguido | Sección Usados | reformulado | Contanos qué buscás y consultá la disponibilidad de unidades. | Requiere confirmación del dueño |
| 5 | Sin vueltas, sin terceros | Plan canje | eliminado | — | Requiere confirmación del dueño |
| 6 | Tasamos en el momento | Paso del plan canje | reformulado | Consulta de tasación | Requiere confirmación del dueño |
| 7 | El sedán más vendido del mundo | Descripción de Corolla | reformulado | Sedán Toyota con versión híbrida disponible según configuración vigente. | https://www.toyota.com.ar/modelos/corolla |
| 8 | respaldo de la red oficial Toyota | Descripción de Yaris | reformulado | Compacto y ágil para el uso urbano. | Requiere confirmación del dueño |
| 9 | Opiniones reales / reseñas verificadas | Sección Testimonios | reformulado | Reseñas en Google / reseñas en Google | Requiere confirmación del dueño |
| 10 | instalado en planta de Zárate | Pie de foto de Accesorios | reformulado | instalado en el concesionario | Requiere confirmación del dueño |
| 11 | Neumáticos originales, colocados en el concesionario oficial | Tarjeta de postventa y FAQ/formulario relacionados | reformulado | Neumáticos Bridgestone; consultá disponibilidad y colocación. | Requiere confirmación del dueño |
| 12 | Mantenimiento ... con la garantía y los tiempos que pide Toyota | Tarjeta de service | reformulado | Mantenimiento programado; consultá las condiciones indicadas por Toyota. | Requiere confirmación del dueño |
| 13 | Garantía de fábrica / condiciones de garantía de modelos | Ficha/FAQ | reformulado | Consultá con el equipo de service las condiciones vigentes de mantenimiento y garantía del vehículo. | Requiere confirmación del dueño |
| 14 | La pick-up más vendida de Argentina en las últimas dos décadas | Hero y nota comparativa de `hilux.html` | reformulado y respaldado | La pick-up más vendida de Argentina durante 20 años consecutivos (2006–2025, según Toyota Argentina) | https://www.toyota.com.ar/descubri/newsroom/noticias-de-argentina/2025-record-para-toyota-numero-uno-en-ventas-produccion-y-exportacion-por-quinto-ano-consecutivo-y-20-anos-de-hilux-como-la-pick-up-mas-elegida-por-los-argentinos |
| 15 | 10 años (garantía extendida "Toyota 10") | Dato destacado del hero de `hilux.html` | reformulado | Hasta 10 años: 5 años de garantía oficial, extensible con "Toyota 10" y service oficial | https://www.toyota.com.ar/descubri/newsroom/noticias-de-argentina/toyota-10-toyota-argentina-redefine-el-estandar-de-la-industria-y-extiende-hasta-10-anos-la-garantia-de-sus-vehiculos |
| 16 | "La pick-up más vendida…", tag "Pick-up Toyota" y cuatro datos destacados de Hilux (224 CV, 1.083 L, 10 años) escritos a mano | Hero de `templates/model.html` | reemplazado por marcadores `[Completar …]` | Cada ficha nueva debe completarlos con datos y fuente propios | Requiere fuente oficial por modelo |

## Datos base a confirmar con el dueño

- Nombre comercial y razón social.
- Dirección.
- Teléfonos.
- WhatsApp.
- Horarios.
- Instagram.

## Decisiones conservadoras

Yaris Cross se incorporó al catálogo con descripción breve y fuente oficial, pero se excluyó del comparador porque el repositorio no contiene datos comparables suficientes y el brief prohíbe inventarlos. No se incorporaron fotos nuevas ni se modificaron SVG. En la fuente oficial se encontró la página de Yaris Cross y la oferta de SW4; no se encontró Fortuner como modelo argentino vigente en la consulta realizada. La lista exhaustiva de modelos oficiales faltantes no pudo extraerse de la página dinámica sin inventar datos, por lo que requiere una revisión manual adicional en la página de modelos de Toyota Argentina.

## Verificaciones posteriores (24 de septiembre de 2026)

- Las filas 14 y 15 se verificaron contra el newsroom de Toyota Argentina. "2006–2025" describe una racha ya cerrada: al terminar 2026 hay que confirmar con el comunicado de cierre de año si la racha se extiende y actualizar el texto.
- "Toyota 10" aplica a unidades 0 km y a las patentadas desde 2020, y exige realizar el mantenimiento en la red oficial. Las condiciones vigentes se confirman en los términos y condiciones de garantía de Toyota Argentina antes de publicar.
- Revisión pendiente en el resto de `templates/model.html`: la plantilla todavía contiene datos específicos de Hilux (versiones, motores, dimensiones, off-road, colores, accesorios, FAQ y fuentes). Ninguno es una afirmación verificada sobre otro modelo (ver `FICHA-MADRE.md`).

## Chequeo exhaustivo de `hilux.html` y `templates/model.html` (25 de septiembre de 2026)

Verificación punto por punto de cada spec técnica y afirmación cuantitativa contra fuentes oficiales de Toyota Argentina y cobertura especializada independiente.

### Confirmado correcto

| Afirmación | Estado | Fuente de verificación |
|---|---|---|
| Motor 1GD 2.8 l: 204 CV / 150 kW, 500 Nm (SRV/SRV+/SRX) | ✅ Confirmado | Ficha oficial Toyota Argentina y múltiples concesionarios oficiales |
| Motor 2GD 2.4 l: 150 CV, 400 Nm (DX/SR) | ✅ Confirmado | Fichas de concesionarios oficiales Toyota |
| Dimensiones SRV/SRX: 1.855×1.815 mm, batalla 3.085 mm, despeje 227 mm, tanque 80 l, radio de giro 6,7 m, remolque 3.500/750 kg | ✅ Confirmado | Folletos oficiales Toyota Argentina (2021–2024) |
| GR-Sport: ancho 2.020 mm, alto 1.830 mm, despeje 247 mm, peso 2.125–2.135 kg, PBT 3.140 kg, ángulos 30°/24°/30° | ✅ Confirmado (coincide dato por dato) | PDF oficial ya citado en el repo: media.toyota.com.ar/4168cbbe-e532-...pdf |
| "20 años" de Hilux como pick-up más vendida (2006–2025) | ✅ Confirmado | Comunicado oficial Toyota Argentina, replicado en ~8 medios especializados |
| "Toyota 10": hasta 10 años/200.000 km, aplica a 0 km y unidades desde 2020, requiere service oficial | ✅ Confirmado textualmente | Comunicado oficial y página de garantía de Toyota Argentina |
| Caja de carga: 1.083 litros | ✅ Corroborado | Fuente de mercado especializada (no oficial Toyota, pero consistente) |
| GR-Sport sin CV/Nm en "datos confirmados" (se deja como pendiente) | ✅ Manejo correcto | El repo ya evita afirmar 224 CV/550 Nm del GR-Sport sin ficha oficial que lo respalde directamente; se mantiene así |

### Hallazgos a revisar

1. **Posible mezcla de datos "SRX de plataforma renovada" (línea ~1173 de `hilux.html`).** El texto atribuye a Monkey Motor y PickupArena las medidas "2.020 mm / 1.830 mm / 247 mm" para una supuesta SRX renovada. Al verificar, esas cifras corresponden exactamente a las medidas del **GR-Sport** (ancho ensanchado y despeje característicos de esa versión), no de una SRX. Es probable que haya una confusión de atribución entre ambas fuentes secundarias. **Acción recomendada:** revisar Monkey Motor/PickupArena directamente o retirar la fila hasta confirmar si existe una SRX real con esas medidas.
2. **Discrepancia menor de 10 mm en el largo total.** Un folleto oficial 2021 de SRV indica 5.315 mm; el repo usa 5.325 mm (coincide con la ficha GR-Sport y fuentes 2023–2025 más recientes). No se considera error, pero se documenta la variación entre años de ficha.

### Alcance de esta revisión

Cubrió `hilux.html` completo y la sección de datos de `templates/model.html` (que reutiliza las mismas cifras de Hilux, ya verificadas arriba). **No se revisó `index.html`** en esta pasada — queda pendiente si se solicita continuar.
