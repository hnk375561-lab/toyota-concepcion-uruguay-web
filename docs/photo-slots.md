# Photo slot specification

| Slot | Ratio | Minimum resolution | Role |
|---|---:|---:|---|
| Hero desktop | 16:9 | 1800 px wide | LCP visual above the fold; use up to 2400 px only when needed. |
| Hero mobile | 4:5 | 1200 px tall | Dedicated narrow viewport crop with the vehicle and subject kept inside the safe area. |
| Featured vehicle | 4:5 | 800 px tall | Editorial vehicle feature and model spotlight. |
| Model card | 4:5 | 800 px tall | Gama cards; 480 px mobile and 800 px desktop variants. |
| Facilities | 3:2 | 1200 px wide | Showroom, workshop and dealership context. |
| Gallery | 3:2 or 16:9 | 1200 px wide | Lazy-loaded gallery and lightbox material. |

All crops preserve the dominant subject, retain a stable aspect ratio, and are exported as AVIF only when smaller than the equal-size WebP; WebP remains the fallback. The pipeline applies one restrained, repeatable grade and never upscales.
