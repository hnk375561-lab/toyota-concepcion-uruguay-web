# Rendimiento en producción — Fase 2

## Medición P0

Se intentaron cinco corridas móviles y cinco desktop contra la URL pública mediante la API de PageSpeed Insights, con categoría `performance`. Las diez respuestas fueron HTTP 429 `Too Many Requests`. No se usó una clave de API y no se repitieron las consultas más allá de las cinco corridas por estrategia.

| Métrica | Móvil, 5 corridas | Desktop, 5 corridas |
|---|---:|---:|
| FCP | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| LCP | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| TBT | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| CLS | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| Speed Index | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| Total byte weight | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |
| Elemento LCP | NO VERIFICADO — PSI respondió 429 | NO VERIFICADO — PSI respondió 429 |

La comparación contra las medianas finales de la Fase 1 también queda **NO VERIFICADA**, porque el informe de Fase 1 no contiene medianas numéricas de Lighthouse: la ejecución local de Lighthouse/Playwright falló por `npm ERR_SSL_CIPHER_OPERATION_FAILED`.

## Decisión de optimización

P1 no se ejecutó. No se puede determinar si se incumplen los umbrales de referencia de LCP, TBT o CLS ni demostrar que `loading="lazy"` reduzca el peso inicial sin empeorar LCP o CLS. Por lo tanto no se agregó `loading="lazy"` adicional ni se modificaron imágenes existentes.

P2 queda reportado como **NO VERIFICADO**: no se obtuvieron las cinco long tasks más costosas, el costo de `document.write` de Lenis, el peso medido de scripts inline ni una medición de la dependencia de `unpkg.com` y `cdn.rive.app`.

El cambio estructural mayor que probablemente permitiría una mejora adicional sería separar o diferir la lógica JavaScript inline pesada y revisar el pipeline de imágenes y dependencias de terceros. No se hizo en esta demo porque excede la única optimización permitida en esta ronda y no hubo métricas PSI válidas que justificaran un cambio seguro.

## Límites

Lighthouse es laboratorio y no representa usuarios reales; existe variación entre corridas; PSI puede variar por región; y en esta sesión PSI no entregó datos debido a HTTP 429.
