# Rendimiento: antes y después

## Alcance y estado

La medición C0/C1 no pudo completarse en esta sesión. Se levantó el sitio localmente con `python3 -m http.server 8765 --bind 0.0.0.0`, pero la instalación temporal de Lighthouse y Playwright falló antes de ejecutar una corrida por `npm ERR_SSL_CIPHER_OPERATION_FAILED`. No se conservaron cambios de rendimiento sin medición.

| Métrica | C0 local antes | Cierre local después | Producción pública |
|---|---:|---:|---:|
| FCP | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |
| LCP | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |
| TBT | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |
| CLS | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |
| Speed Index | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |
| Total byte weight | NO VERIFICADO | NO VERIFICADO | NO VERIFICADO |

## Candidatos

C1-a, preload móvil desperdiciado: **no ejecutado** porque no fue posible completar C0 ni las cinco corridas antes/después. El preload original se conserva para no afirmar una mejora no medida.

C1-b, Google Fonts no bloqueante: **no ejecutado** porque no fue posible completar C0 ni las cinco corridas antes/después.

C1-c, hero desktop de 1200 px: **omitido: condición no verificada**. No se pudo comprobar mediante Lighthouse/PerformanceObserver que el elemento LCP desktop fuera la imagen del hero ni que su descarga fuera el mayor componente del LCP.

## Hallazgos no corregidos

No se midieron `render-blocking-resources`, `bootup-time`, `mainthread-work-breakdown`, `third-party-summary`, `unused-javascript`, `uses-rel-preload` ni `dom-size`.

No se ejecutaron las matrices Playwright de 390×844, 820 px y 1440×900 px, ni el bloqueo de los hosts de Rive, ni las comprobaciones de `pageerror`, `console.error` y respuestas 4xx/5xx.

Las métricas Lighthouse simuladas no equivalen a usuarios reales; las mediciones locales no equivalen a producción; y las corridas presentan variación. En esta sesión, además, no hay mediciones numéricas que comparar.
