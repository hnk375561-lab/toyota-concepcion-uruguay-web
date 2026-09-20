# Go-live checklist

El repositorio de demo conserva `noindex, nofollow` en `index.html` y en `404.html`. Nada cambia hasta ejecutar `bash golive/golive.sh` con un dominio y confirmar.

## Antes de ejecutar

1. Confirmá por escrito el dominio final, teléfono, WhatsApp, horarios, dirección y redes.
2. Revisá la demo en 390, 768, 1440 y 1920 px; no publiques si hay errores de consola o enlaces rotos.
3. Instalá las dependencias del script: `pip install beautifulsoup4 lxml`.
4. Validá el HTML (ver "Validación de HTML" más abajo).

## Ejecución

```bash
# 1) Simulación: muestra cada cambio y un diff, verifica el resultado y NO escribe nada
DOMAIN=www.ejemplo.com.ar bash golive/golive.sh --dry-run

# 2) Ejecución real (pide confirmación; --yes la omite, útil en CI)
DOMAIN=www.ejemplo.com.ar bash golive/golive.sh
```

También acepta `--domain www.ejemplo.com.ar`. El dominio va sin ruta; se aceptan con o sin `https://`. `github.io` se rechaza a propósito: es el host de la demo con `noindex`.

### Qué hace

El script usa BeautifulSoup para **ubicar** las etiquetas (sin regex sobre el HTML, por lo que no importa el orden de los atributos) y reemplaza solo esos bytes: el resto de `index.html` queda idéntico. No reserializa el documento porque BeautifulSoup reordena atributos y cambia mayúsculas en SVG (`linearGradient`).

- `meta robots` y `meta googlebot` → `index, follow` (si faltan, los crea).
- `og:url` → `https://DOMINIO/`; `og:image` y `twitter:image` → URL absoluta del dominio (misma ruta de archivo).
- JSON-LD: `url`, `@id` e `image` que apuntan al sitio previo pasan al dominio; los enlaces a otros orígenes (Instagram, Toyota) no se tocan.
- Un único `<link rel="canonical" href="https://DOMINIO/">` dentro de `<head>`. Si ya hay uno lo actualiza; si hay más de uno, deja uno.
- Genera `sitemap.xml` y `robots.txt` (con la línea `Sitemap:`).
- `404.html` **no se modifica** y debe conservar `noindex`; el script lo verifica.

Es **idempotente**: una segunda corrida con el mismo dominio no cambia ningún archivo. Con otro dominio, reemplaza el anterior.

### Verificaciones y código de salida

Después de calcular los cambios, y antes de escribir, se verifica el resultado con un parser independiente (lxml). Si algo falla **no se escribe ningún archivo** y el script termina con código 1:

- `index.html` no debe contener la palabra `noindex` en ningún lugar.
- `robots` y `googlebot` deben valer `index, follow`.
- Debe haber exactamente un `canonical` y estar dentro de `<head>`, apuntando al dominio.
- Ningún `og:*` ni `twitter:*` puede apuntar a `github.io`; `og:url`, `og:image` y `twitter:image` deben ser absolutas del dominio.
- El JSON-LD no puede contener `github.io`.
- `404.html` debe conservar `noindex`.

Tras escribir, se vuelve a leer desde disco y se repite la verificación. Códigos: `0` OK · `1` verificación fallida · `2` uso o dependencias · `3` error de lectura o de edición.

## Después de ejecutar

1. Revisá `git diff`: solo deben cambiar metas, el canonical y dos líneas del JSON-LD; más `sitemap.xml` y `robots.txt` nuevos.
2. Verificá `robots.txt`, `sitemap.xml`, canonical y Open Graph en el dominio final.
3. Si el hosting es GitHub Pages con dominio propio, agregá el archivo `CNAME` con el dominio.
4. `404.html` enlaza a `/toyota-concepcion-uruguay-web/` (ruta de la demo). En un dominio propio en la raíz debe apuntar a `/`; el script no lo cambia, hacelo a mano.
5. Configurá `GA4_ID` solo si existe consentimiento y una política de privacidad aprobada.
6. Volvé a ejecutar los tests funcionales sobre la URL publicada y enviá el sitemap en Search Console.

## Validación de HTML

```bash
npm i vnu-jar
java -jar node_modules/vnu-jar/build/dist/vnu.jar --format json --skip-non-html index.html
```

Resultado esperado: **3 errores**, todos falsos positivos aceptados del validador (el navegador soporta esas construcciones):

| Mensaje | Dónde | Motivo |
|---|---|---|
| CSS: `transition-behavior` "doesn't exist" | `lenis-essential-css` | Propiedad CSS vigente que el validador todavía no conoce. |
| CSS: `background-image: image-set(... type(...))` (2 casos) | `.cta-banner-optimized` y `#concesionario .social-preview-art-optimized` (AVIF + WebP) | `type()` en `image-set()` es CSS válido; el validador no lo reconoce. |

Los avisos `info` "Trailing slash on void elements" (`<meta ... />`) son informativos y se aceptan; los avisos `info` sobre `section`/`article` sin encabezado tampoco son errores.
