# CLAUDE.md — Guía de mantenimiento

Sitio estático de Piñeyro y Moscatelli S.R.L. (Toyota Concepción del Uruguay). Esta guía es para
quien haga los cambios (una persona o Claude Code) cuando el dueño del concesionario pida algo.
Está pensada para alguien que **no programa**: cada receta dice qué archivo tocar, qué buscar y
cómo comprobar que no se rompió nada.

Leé primero las "Reglas de oro". Después, andá directo a la receta del pedido.

---

## 1. Reglas de oro

1. **Nunca publicar sin tests verdes.** Todo cambio va en una rama y por pull request. Solo se
   hace merge a `main` cuando la corrida de GitHub Actions termina en verde. Un push a `main`
   publica automáticamente, y solo si los tests pasan.
2. **Cero datos inventados.** No se escriben precios, tasas, stock, plazos, promociones,
   rankings, premios ni garantías que el dueño no haya confirmado por escrito o que no estén en
   una fuente oficial de Toyota Argentina. Si falta el dato, el texto dice "consultá con el
   equipo" (así está hecho hoy).
3. **Toda afirmación nueva se registra** en `golive/AFIRMACIONES-A-CONFIRMAR.md` con su fuente
   y la fecha en que se verificó.
4. **Fotos:** solo se suben imágenes que el concesionario o Toyota Argentina hayan autorizado.
   Las fotos actuales son ilustrativas (la demo lo dice). Antes de salir a producción se
   reemplazan por las oficiales.
5. **No se refactoriza.** `index.html` pesa unos 500 KB y su CSS tiene muchas capas de
   parches. Se hace el cambio mínimo. No se reordena, no se "limpia" y no se reescribe una
   sección entera para cambiar una palabra.
6. **Mientras siga en modo demo**: se conserva `noindex, nofollow`, el banner DEMO y el aviso
   de demo. Se quitan solo con el procedimiento de go-live (sección 6).

## 2. Mapa del repo

| Qué | Dónde |
|---|---|
| Home (todo el sitio principal) | `index.html` (HTML + CSS + JS en un solo archivo) |
| Ficha de Hilux | `hilux.html` (escrita **a mano**; el build no la regenera) |
| Plantilla para fichas nuevas | `templates/model.html` (su hero son marcadores `[Completar …]`) |
| Datos de fichas | `data/models.json` |
| CSS de las fichas | `toyota-sharp-assets/model-ficha.css` (la home NO lo usa) |
| Imágenes, fuentes y librerías | `toyota-sharp-assets/` |
| Tests | `tests/` (Playwright, accesibilidad, validador HTML, Lighthouse) |
| Publicación | `.github/workflows/deploy.yml` y `scripts/build.sh` (solo se publica `dist/`) |
| Pasar a producción | `golive/` |
| Cómo clonar una ficha | `FICHA-MADRE.md` |
| Afirmaciones verificadas | `golive/AFIRMACIONES-A-CONFIRMAR.md` |

Cosas que hay que saber:

- **Home y fichas tienen CSS separado.** Un cambio de estilo del header o del pie hay que
  hacerlo en `index.html` **y** en `model-ficha.css` (y comprobar que se vean iguales).
- El header de la home y el de `hilux.html` deben tener los mismos links. Si se agrega uno,
  se agrega en los dos.
- Para cambiar estilos en `index.html`, se agrega una regla **al final del bloque de estilos
  permanente** (el que termina justo antes de `<style id="spec-compliance-final">`), con un
  selector más específico. No se toca el bloque `DEMO:START/END`, porque desaparece en el go-live.

## 3. Flujo de cada pedido

```bash
git checkout main && git pull
git checkout -b cambio-descripcion-corta      # una rama por pedido
# ... hacer el cambio (secciones 4 y 5) ...
npm ci                                        # solo la primera vez
npx playwright install chromium               # solo la primera vez
npm test -- --skip-lighthouse                 # tests completos sin Lighthouse
node scripts/check-ficha.mjs hilux.html       # si se tocó hilux.html o el JSON de fichas
git add -A && git commit -m "Descripción del cambio"
git push -u origin cambio-descripcion-corta   # abrir pull request en GitHub
```

- En el pull request corre la suite y **no publica**. Con todo en verde, merge a `main` y se
  publica solo.
- El paso de Lighthouse no bloquea (el rendimiento móvil hoy no cumple el presupuesto) y el job
  de Firefox/Safari tampoco. Igual, si un cambio los empeora, hay que decirlo.
- Si un test falla, **no se debilita el test para que pase**. Se arregla el cambio. Se toca un
  test solo cuando el pedido cambia algo que el test verifica a propósito (por ejemplo,
  horarios o cantidad de modelos), y se explica por qué.
- Requisitos locales: Node ≥ 22.19 y Java (para el validador HTML).

## 4. Recetas por tipo de pedido

### 4.1 Cambiar un teléfono o un WhatsApp

Hay tres números: ventas, repuestos y neumáticos. Un teléfono aparece en muchos lugares. Buscar
**todas** las apariciones:

```bash
grep -rn "3442473453\|47-3453" index.html hilux.html templates/model.html tests README.md
```

Dónde hay que cambiarlo (ejemplo con el de ventas, `03442 47-3453` / `5493442473453`):

- `index.html`: enlaces `tel:+54…`, textos visibles `03442 47-3453`, el objeto
  `WHATSAPP_NUMEROS` (ventas / repuestos / neumáticos), el JSON-LD `"telephone"` y el rótulo
  vertical del hero (formato `47-3453`).
- `hilux.html` y `templates/model.html`: enlaces `wa.me/549…` y `tel:` escritos a mano.
- `tests/support/helpers.js` (`CANALES`) y `tests/e2e/ficha-hilux.spec.js`: los tests
  comparan contra los números, así que se actualizan con los mismos valores.
- `README.md`: la tabla "Cómo editar".

Formato WhatsApp: `549` + característica sin 0 + número sin 15 (Concepción: `54 9 3442 …`).

### 4.2 Cambiar horarios

Los horarios están en **cuatro** lugares y deben coincidir:

1. Texto visible en la sección de ubicación de `index.html` (buscar `Lunes a viernes`,
   `Sábados` y `Lunes a sábado`).
2. La lógica del cartel "Abierto / Cerrado" en `index.html`, script `location-status-once`.
   Los horarios están en **minutos desde medianoche**. Hoy: 480–720 (8 a 12) y 840–1080 (14 a
   18) de lunes a viernes, y 480–720 los sábados. Los textos "Abre hoy a las 08:00" salen de
   ahí.
3. El JSON-LD `openingHoursSpecification` de `index.html` (buscar `"opens"`).
4. `tests/e2e/horarios.spec.js`: los casos de prueba tienen los horarios escritos. Actualizarlos
   con los mismos valores.

### 4.3 Cambiar la dirección

Buscar `9 de Julio 1624` (aparece en unas 16 partes de `index.html`). También cambiar el JSON-LD
`PostalAddress`, la URL del mapa embebido (`<iframe … google.com/maps?q=…`) y los enlaces a
Google Maps y Apple Maps.

### 4.4 Agregar o cambiar una promoción / novedad

Sección `#novedades` de `index.html`. Hoy son tarjetas genéricas que abren WhatsApp con un
mensaje ("Consultar por WhatsApp"). Para una promoción concreta:

- Pedir por escrito: texto exacto, **vigencia** (fecha de fin), modelos y condiciones.
- No poner precio, cuota ni tasa que el dueño no haya dado.
- Anotar en el texto hasta cuándo vale, y **sacarla cuando venza**.
- Registrar la afirmación en `golive/AFIRMACIONES-A-CONFIRMAR.md`.

### 4.5 Cambiar o poner la foto de un modelo

1. Confirmar que la imagen está autorizada (dueño o Toyota Argentina).
2. Generar **cuatro variantes** en `toyota-sharp-assets/` con el mismo nombre base:
   `nombre-800.webp`, `nombre-480.webp`, `nombre-800.avif`, `nombre-480.avif`. (Pedirle a Claude
   Code que las genere con `sharp`.)
3. En `index.html`, dentro de `MODELOS_TOYOTA`, poner en ese modelo `foto:` con la ruta
   `toyota-sharp-assets/nombre-800.webp` y los `fotoW` / `fotoH` reales. Con `foto` cargado, la
   tarjeta deja de mostrar la silueta.
4. Todas las fotos de la gama se muestran en el mismo marco y **se recortan** (`object-fit:
   cover`). Si una foto queda mal encuadrada, ajustar el `object-position` en la regla del
   modelo, en el bloque "Tarjetas de la gama" del CSS de `index.html`. No hace falta tocar la
   imagen.
5. Abrir también el detalle del modelo (botón "Ver ficha") y comprobar que se vea bien.

### 4.6 Agregar un modelo al catálogo de la home

En `index.html`:

1. `MODELOS_TOYOTA`: una línea con `nombre`, `tipo` (`pickup`, `suv` o `sedan`), `desc`, y
   `foto` **o** `silueta` (`suv`, `sedan` o `hatch`) con su `etiqueta`.
2. `MODEL_DETAILS`: la entrada del modelo (`intro`, `specs`, `source` con el enlace oficial de
   Toyota Argentina y, si existe, `page`).
3. Sumarlo al comparador solo si hay **datos oficiales comparables** (`COMPARISON_DETAILS`).
   Hoy solo comparan 5 modelos. El test `comparador.spec.js` (lista `MODELOS`) verifica esa
   lista a propósito.
4. Los tests que cuentan tarjetas (`deep-links.spec.js`, `salud.spec.js`) pueden necesitar un
   ajuste de cantidad. Correr los tests y actualizar **solo** esos números.

### 4.7 Hacer la ficha completa de un modelo nuevo

Seguir `FICHA-MADRE.md` (clonar `hilux.html` y reemplazar **cada dato** con la fuente oficial).
No generar la ficha directo desde la plantilla sin reescribir las secciones que ese archivo
lista, porque contienen datos de Hilux.

### 4.8 Stock de usados

Hoy `#usados` es un formulario que arma una consulta por WhatsApp. **No hay estructura de stock
cargada.** Publicar unidades reales es un trabajo aparte: definir el formato de datos, las
tarjetas, las fotos y las reglas de precio con el dueño. No improvisarlo.

### 4.9 Financiación (simulador)

El simulador de la sección `#financiacion` usa `TASA_ANUAL_EJEMPLO = 0.42`, una tasa **de
ejemplo que no es real**. El texto dice "estimación ilustrativa — no es una cotización". Cambiar
la tasa solo con una línea vigente confirmada por escrito por el concesionario. El aviso
"no es una cotización" se mantiene.

### 4.10 Textos, preguntas frecuentes y datos de la empresa

- Textos: se editan directo en el HTML de la sección.
- FAQ de la **home**: hay JSON-LD `FAQPage` en `index.html` que debe coincidir con el texto
  visible.
- FAQ de **`hilux.html`**: después de editar, correr `npm run sync-schema` y
  `node scripts/check-ficha.mjs hilux.html`.
- Política de privacidad: está marcada como **borrador** (`#privacyDialog`). Antes de publicar
  la tiene que revisar el concesionario.
- CUIT y razón social: hoy dice "CUIT: a confirmar con el concesionario" (`.demo-legal-line`).
- Instagram: `@toyotacdelu` (aparece en enlaces y en el JSON-LD `sameAs`).

### 4.11 Analítica

`GA4_ID` (al inicio del script `analytics-events` de `index.html`) está vacío, y por eso no hay
requests externos. Se completa **solo** si el concesionario aprueba la medición y la política de
privacidad está aprobada. Los tests exigen 0 requests externos; con GA4 activo hay que
actualizar esa excepción a propósito.

## 5. Antes de aprobar un cambio (checklist)

- [ ] Los tests dan verde en GitHub Actions (o `npm test -- --skip-lighthouse` en local).
- [ ] Se abrió el sitio en 1440 px (escritorio) y 390 px (celular). Sin cortes ni textos
      superpuestos.
- [ ] Si se tocó un dato que aparece en varios lugares (teléfono, horario, dirección), se
      buscó con `grep` que no quede la versión vieja.
- [ ] Ninguna afirmación nueva sin fuente. Registrada en `AFIRMACIONES-A-CONFIRMAR.md`.
- [ ] Si se tocó `hilux.html`: `npm run sync-schema` y `check-ficha` en OK, y la fecha
      "Datos revisados" coincide con `dataPolicy.consultedAt` de `data/models.json`.
- [ ] Solo cambiaron los archivos que el pedido necesitaba (`git diff --stat`).

## 6. Pasar de demo a producción

Está en `golive/GO-LIVE.md` y en la sección "Modo demo" del `README.md`. En resumen:

1. Confirmar por escrito dominio, teléfonos, WhatsApp, horarios, dirección, redes, razón
   social y CUIT.
2. Reemplazar las fotos ilustrativas por las oficiales autorizadas.
3. Quitar todo lo marcado `DEMO` (`grep -n "DEMO" index.html`).
4. `DOMAIN=www.ejemplo.com.ar bash golive/golive.sh --dry-run` y después la ejecución real.
5. El dominio se registra **a nombre del concesionario**. Agregar el archivo `CNAME` y corregir
   a mano el enlace de `404.html` (apunta a la ruta de la demo).

## 7. Cómo pedirle un cambio a Claude Code

Pegar el pedido del dueño así (completar lo que se sepa):

```
Pedido del dueño (textual): "..."
Fecha del pedido: ...
Archivos que creo que se tocan: ... (o "no sé")
Datos confirmados por escrito: ... (o "ninguno")

Seguí CLAUDE.md. Hacé el cambio mínimo en una rama, corré los tests y mostrame
el resumen de lo que cambió (git diff --stat) y qué verificaste.
Si falta un dato, no lo inventes: preguntame.
```

Y para responderle al dueño, un mensaje corto: qué se cambió, que ya está publicado (o el
enlace de revisión), y qué datos faltan si quedó algo pendiente.
