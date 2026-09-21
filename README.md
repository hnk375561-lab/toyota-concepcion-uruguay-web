# Toyota Concepción del Uruguay
Sitio estático de Piñeyro y Moscatelli, concesionario oficial Toyota.
La página pública está en `index.html`.
Los recursos visuales y locales están en `toyota-sharp-assets/`.
La publicación conserva `noindex` para revisión previa.

## Cómo editar

El sitio es un documento estático autocontenido en `index.html`. Para mantener la demo consistente, editá primero las variables y bloques indicados abajo y no reemplaces datos comerciales sin validarlos con el concesionario.

| Necesidad | Ubicación exacta |
|---|---|
| Teléfono principal (Central a confirmar) | Constantes y enlaces `tel:+543442473453`; buscá también `03442 47-3453`. |
| WhatsApp | Función `wa(...)` y enlaces `https://wa.me/5493442473453`. |
| Horarios y badge | Bloque `location-status-once`, función `getOpeningStatus` y el elemento `#locationStatus`. |
| Dirección | Datos visibles `9 de Julio 1624` y JSON-LD `PostalAddress`. |
| Modelos del catálogo | Array `MODELOS_TOYOTA`; sus filtros usan `tipo: pickup`, `suv` o `sedan`. |
| Textos | HTML de cada sección; los títulos principales están en `.section-head h2`. |
| Fotos | Atributos `src`, `srcset` y `picture` que apuntan a `toyota-sharp-assets/`. |
| Analítica | Constante `GA4_ID` al inicio del script `analytics-events`. Vacía no hace requests externos. |

### Eventos de analítica disponibles

`toyotaTrack(...)` deja los eventos en `window.dataLayer` y, únicamente cuando `GA4_ID` tiene un ID real, los envía a GA4: `whatsapp_click`, consultas de modelos, comparación, formularios de contacto/tasación, filtros de catálogo y acciones de ubicación. Para activar la medición, reemplazá `GA4_ID=""` por el ID aprobado y revisá la política de privacidad antes de publicar. La demo actual permanece sin tracking externo.

## Publicación en GitHub Pages

Solo se publica `dist/`, que genera `scripts/build.sh`: `index.html`, `404.html`, `toyota-sharp-assets/` y `.nojekyll` (más `robots.txt` y `sitemap.xml` si existen en la raíz, porque los crea `golive/golive.sh`). `tests/`, `golive/`, `scripts/`, `.github/` y este README quedan fuera y dejan de ser URLs públicas.

**Configuración necesaria (una sola vez, manual):** en el repositorio, *Settings → Pages → Build and deployment → Source* debe estar en **GitHub Actions**. Mientras siga en "Deploy from a branch", Pages sigue sirviendo la raíz del repo completa y el workflow no reemplaza esa publicación.

El workflow `.github/workflows/deploy.yml`:

- En cada *pull request*: genera `dist/` y corre la suite (`npm test`, ver abajo) sobre `dist/`. No publica.
- En cada push a `main` (o ejecución manual sobre `main`): lo mismo y, solo si los tests pasan, publica `dist/` con `actions/upload-pages-artifact` y `actions/deploy-pages`.
- Siempre adjunta el artefacto `build-report` (reporte de assets y resultado de los tests).

### Build local

```bash
bash scripts/build.sh                # dist/ + reporte de assets con crawl de red
SKIP_CRAWL=1 bash scripts/build.sh   # dist/ + reporte solo estático (no requiere navegador)
```

El crawl necesita `pip install playwright` y `playwright install chromium` (o `CHROMIUM_PATH` apuntando a un Chromium). Para probar lo que se publica:

```bash
python3 -m http.server 8000 --directory dist &   # en otra terminal
python3 tests/click-audit.py
```

### Reporte de assets sin referencia

`build-report/unreferenced-assets.md` (más `.txt` y `.json`) clasifica cada archivo de `toyota-sharp-assets/` según un crawl de red en 4 viewports (1440, 1440 reducido, 820 y 390 px) que recorre el scroll, todas las pestañas, filtros y carruseles, y según las referencias del código. **Es informativo: no borra nada** y `dist/` incluye todos los assets. Las variantes `-480/-800/-1800` en avif/webp que el JavaScript arma a partir de un `-800.webp` se tratan como en uso.

### Estado de publicación

La versión de demo mantiene `noindex, nofollow` en `index.html`. El procedimiento de puesta en producción se coordina con el desarrollador y no se ejecuta automáticamente.

## Tests (`tests/`, `npm test`)

Playwright + axe-core + validador Nu + Lighthouse, todo sobre `dist/` (lo que se publica). Requiere Node ≥ 22.19 y Java (para el validador).

```bash
npm ci
npx playwright install chromium
npm test                        # build + e2e + axe + HTML + Lighthouse
npm test -- --skip-lighthouse   # sin presupuestos de Lighthouse
npm test -- --only-lighthouse
npm test -- --grep horarios     # el resto de los argumentos va a `playwright test`
```

| Archivo | Cubre |
|---|---|
| `tests/e2e/navegacion.spec.js` | Clic real en los 12 links de escritorio (mega menús) y los 19 del drawer móvil. |
| `tests/e2e/deep-links.spec.js` | Abrir directamente en `#seccion`, tabs, `#comparar?a=&b=`, `#gama?filter=`. |
| `tests/e2e/hero.spec.js` | Hero quieto: delta 0 en reposo, con scroll y con mouse (motion normal y reduced). |
| `tests/e2e/horarios.spec.js` | Badge abierto/cerrado con `page.clock` (dom 11:00, sáb 09:00, sáb 13:00, lun 10:00, lun 12:30, lun 15:30, vie 19:30, lun 00:30, más bordes de franja). |
| `tests/e2e/formularios.spec.js` | Contacto (vacíos, motivo → número y mensaje de WhatsApp) y tasación. |
| `tests/e2e/comparador.spec.js` | Selects, tarjetas, mismo modelo, reinicio, hash y WhatsApp. |
| `tests/e2e/salud.spec.js` | 0 `console.error/warning`, 0 requests externos, 0 4xx/5xx, sin overflow, filtros y 404. |
| `tests/e2e/accesibilidad.spec.js` | axe WCAG A/AA = 0 en la página, cada tab y estados interactivos. |
| `tests/e2e/html-validator.spec.js` | Validador Nu: 0 errores (excepciones documentadas en `tests/support/vnu-allowlist.json`). |
| `tests/lighthouse/` | Presupuestos en `budgets.json` (mobile ≥ 95, desktop ≥ 98, a11y 100, best practices 100), mediana de 3 corridas. Reporte en `build-report/lighthouse/`. |

`tests/click-audit.py` es la auditoría anterior en Python; ya no la ejecuta el CI (su cobertura está en esta suite).

### Cross-browser (Firefox y WebKit)

Navegación (12 links de escritorio y 19 del menú móvil), hero quieto y formularios, a **1440** y a **390** px, en Firefox y WebKit. Los mismos specs que Chromium (`navegacion`, `hero`, `formularios`); el resto de la suite corre solo en Chromium.

```bash
npx playwright install --with-deps firefox webkit
npm run test:cross          # proyectos firefox-1440, firefox-390, webkit-1440, webkit-390
```

En CI es el job `cross-browser` de `deploy.yml` (no bloquea el deploy; reporte en el artefacto `build-report-cross-browser`). Firefox no soporta la opción `isMobile` de Playwright: en `firefox-390` se emula el viewport y el touch, no el meta viewport.


## Modo demo: qué quitar en el go-live

Antes de publicar, quitá todo lo marcado `DEMO`: el banner fijo y sus estilos, el prefijo `DEMO · ` en `title`, `og:title` y `twitter:title`, el `meta author` de propuesta independiente, las etiquetas `.demo-tag`, el bloque `#aviso-demo`, el texto de siluetas y de `Stock de usados`, y la política de privacidad marcada como **borrador**. También confirmá los teléfonos, el CUIT y el resto de los datos indicados como pendientes. Para localizar rápidamente los marcadores del documento usá:

```bash
grep -n "DEMO" index.html
```
