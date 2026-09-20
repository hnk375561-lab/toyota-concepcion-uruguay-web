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

### Estado de publicación

La versión de demo mantiene `noindex, nofollow` en `index.html`. El procedimiento de puesta en producción está preparado en `golive/`, pero no se ejecuta automáticamente.
