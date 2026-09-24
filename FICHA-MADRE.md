# FICHA-MADRE — cómo clonar la ficha de la Hilux a otro modelo

`hilux.html` es la ficha "madre": está escrita a mano, con datos verificados contra las fichas
oficiales de Toyota Argentina. `templates/model.html` es solo un punto de partida genérico
(trae placeholders y un quiz genérico) y **no** es la ficha madre.

## Regla de oro: el build no pisa una ficha a mano

`scripts/build.sh` corre `scripts/generate-model-pages.mjs`. Ese script regenera `<slug>.html`
desde la plantilla **salvo** que el modelo tenga `"handAuthored": true` en `data/models.json`.
Con el flag, el script solo comprueba que el archivo exista y que no tenga placeholders
(`[Completar …]`, `{{…}}`); si los tiene, el build falla. Sin el flag, la plantilla pisa el HTML.

## Pasos para clonar (ej.: SW4)

1. `cp hilux.html sw4.html`.
2. Agregá el modelo a `data/models.json` copiando la entrada de Hilux: `slug`, textos, imágenes,
   `sources` y `"handAuthored": true`.
3. Reemplazá **cada dato**, no solo el nombre. Lo que casi siempre cambia: motores, versiones,
   tabla comparativa, dimensiones, pesos, neumáticos, colores por versión, seguridad, garantía,
   FAQ, fuentes, PDFs oficiales, JSON-LD `Vehicle` y los mapas `CONFIG_VERSIONES` / `COLORES` /
   `COLORES_GR` del `<script>` del configurador.
4. Cambiá las anclas y textos de WhatsApp (`Toyota%20Hilux`) y el `slugJs`/tracking.
5. `npm run sync-schema` (regenera el JSON-LD de FAQ y breadcrumb desde el HTML visible).
6. Agregá el nombre del archivo a `tests/e2e/html-validator.spec.js` y duplicá
   `tests/e2e/ficha-hilux.spec.js` para el modelo nuevo.
7. Agregá las afirmaciones que ya sepas incorrectas a `CLAIMS_PROHIBIDAS` en
   `scripts/check-ficha.mjs`.
8. `npm run check:ficha` y `npm test`.

## Qué de `templates/model.html` es específico de Hilux

El hero de la plantilla (segmento, frase de presentación y los cuatro datos destacados) ya es
neutro: son marcadores `[Completar …]` y `check:ficha` frena la publicación mientras queden. El
resto de la plantilla sigue siendo una copia de la ficha de Hilux con `{{MODEL_NAME}}` puesto en
el lugar del nombre. Eso significa que, si se genera una ficha nueva sin reescribirla, aparecen
frases de Hilux atribuidas al modelo nuevo. Secciones que **siempre** hay que reescribir con
datos oficiales del modelo:

- Noticia de renovación de generación y "datos de la generación vigente".
- Versiones y tabla comparativa (potencias, cajas, tracciones).
- Motores, dimensiones, pesos, capacidades, remolque y calificación Latin NCAP.
- Aptitud off-road y variante deportiva (GR-Sport).
- Colores, accesorios, FAQ y "Fuentes consultadas".
- Configurador y test rápido (`CONFIG_VERSIONES`, perfiles).

Lo que sí es común a todos los Toyota y se puede conservar: el texto de "Toyota 10" (siempre con
el enlace a los términos y condiciones vigentes). Por eso el camino recomendado sigue siendo
clonar `hilux.html` y reemplazar dato por dato (pasos de arriba).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run sync-schema` | Reescribe FAQPage y BreadcrumbList del HTML. Correrlo cada vez que se edite el FAQ. |
| `npm run check:ficha` | Linter: placeholders, clases sin CSS, errores típicos del validador Nu, anclas rotas, JSON-LD, fecha de consulta, datos ya corregidos. |
| `bash scripts/build.sh` | Genera `dist/` (respeta `handAuthored`). |
| `BASE_URL=http://127.0.0.1:8000/hilux.html npm run test -- --only-lh` | Lighthouse sobre la ficha (por defecto mide solo la home). |

## Criterios de datos (los mismos de `dataPolicy` en `models.json`)

- Prioridad: Toyota Argentina. Fuentes complementarias solo si la oficial no consolida el dato, y
  se rotulan como tales.
- Nada de otros mercados (México, Brasil, Chile, Perú, EE. UU.).
- Si dos fuentes discrepan (ej.: SRX renovada 1.855/1.815/227 mm en la ficha oficial de feb-2025 vs
  2.020/1.830/247 mm en medios), se muestran **ambas con su fuente**; no se elige en silencio.
- Cifras calculadas (carga útil = PBT − peso en orden de marcha) van rotuladas "estimación".
- "A confirmar" significa que la documentación consultada no permite afirmarlo ni negarlo.
- No declarar `availability: InStock` ni precios sin confirmación del concesionario.
- Todas las fechas de consulta (`dataPolicy.consultedAt`, `sources[].consultedAt`, "Consulta:" en
  la página) deben coincidir; `check:ficha` lo verifica.

## Pendientes de confirmar con Toyota / el concesionario

- Colores por versión (GR-Sport: 4; Blanco Perlado no existe en SRV 4x2): salen de imágenes del
  configurador de un concesionario, no de una ficha oficial.
- SRX renovada: ancho, alto y despeje (dos fuentes, ver arriba). Con eso queda abierto si la
  GR-Sport realmente suma despeje sobre la SRX.
- Pesos en orden de marcha y despejes de DX/SR/SRV+/SRX por versión (solo hay ficha oficial 2021
  para DX/SR).
- SRV+ (audio JBL, sensores) y GR-Sport (sensores): se marcan "hereda de la SRV" / "A confirmar".
- Cabina Simple y Chasis: PBT y remolque.
