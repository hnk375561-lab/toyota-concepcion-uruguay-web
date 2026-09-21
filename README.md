# Toyota Concepción del Uruguay
Sitio estático de Piñeyro y Moscatelli, concesionario oficial Toyota.
La página pública está en `index.html`.
Los recursos visuales y locales están en `toyota-sharp-assets/`.
La publicación conserva `noindex` para revisión previa.

## Cómo editar

El sitio es un documento estático autocontenido en `index.html`. Para mantener la demo consistente, editá primero las variables y bloques indicados abajo y no reemplaces datos comerciales sin validarlos con el concesionario.

| Necesidad | Ubicación exacta |
|---|---|
| Teléfono principal | Constantes y enlaces `tel:+543442473453`; buscá también `03442 47-3453`. |
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

- En cada *pull request*: genera `dist/` y corre `tests/click-audit.py` sobre `dist/`. No publica.
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

La versión de demo mantiene `noindex, nofollow` en `index.html`. El procedimiento de puesta en producción está preparado en `golive/`, pero no se ejecuta automáticamente.
