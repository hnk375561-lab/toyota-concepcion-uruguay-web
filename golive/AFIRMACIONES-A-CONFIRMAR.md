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
