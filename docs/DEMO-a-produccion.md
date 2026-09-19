# Demo a producción

Este documento registra los interruptores que mantienen esta publicación como demo y los valores que deben restaurarse cuando el dueño confirme que el sitio puede pasar a producción. Las líneas indicadas corresponden al `index.html` de este commit.

| Interruptor de demo | Valor actual | Valor a restaurar en producción |
|---|---|---|
| Meta `robots` | `noindex, nofollow, noarchive, nosnippet` (línea 20) | `index, follow` |
| Meta `googlebot` | `noindex, nofollow, noarchive, nosnippet` (línea 21) | Eliminar la etiqueta y el comentario DEMO de la línea 19 |
| `canonical` | Ausente; se eliminó la línea 38 del estado base | Agregar `rel="canonical"` con el dominio definitivo |
| `og:url` | `https://hnk375561-lab.github.io/toyota-concepcion-uruguay-web/` (línea 30) | Dominio definitivo |
| `og:image` | URL absoluta de GitHub Pages (línea 31) | URL absoluta del dominio definitivo |
| `twitter:image` | URL absoluta de GitHub Pages (línea 37) | URL absoluta del dominio definitivo |
| JSON-LD `url` e `image` | URLs de GitHub Pages (líneas 98–99) | URLs del dominio definitivo |
| Aviso `Sitio de demostración` del footer | Eliminado en este commit (línea 2172 del estado base) | No agregarlo en producción |

## Pendiente de confirmar por el dueño

- Concesionario oficial Toyota desde 1987.
- Horarios de atención publicados en el sitio.
- Teléfonos publicados en el sitio.
- Canales y datos de contacto publicados en el sitio.
- Modelos, versiones, disponibilidad y equipamiento publicados en el sitio.
- Garantías, consumos, dimensiones y demás especificaciones técnicas publicadas en el sitio.
- Fuentes y vigencia de los datos comerciales publicados en el sitio.

La etiqueta `noindex` no elimina contenido que Google ya haya indexado. Eso debe revisarse manualmente buscando `site:hnk375561-lab.github.io/toyota-concepcion-uruguay-web`.
