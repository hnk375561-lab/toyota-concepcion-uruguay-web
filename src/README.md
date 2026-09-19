# src/ — fuente del HTML

`index.html` ya **no se edita a mano**: se genera con `npm run build` a partir de acá.

```
src/
  index.template.html      esqueleto: solo directivas <!--@include ...--> y las etiquetas de cierre/apertura
  partials/
    head.html              <head>: metas, preloads, CSS/JS
    structured-data.html   JSON-LD (SEO)
    skip-link.html, header.html, footer.html
    sections/NN-nombre.html  una por sección de <main>; el ORDEN en la página lo define index.template.html (el número es solo el orden de creación)
    model-detail.html, contact-float.html, mobile-bar.html
```

## Flujo de trabajo

1. Editá el parcial que corresponda (por ejemplo `partials/sections/14-como-comprar.html`).
2. `npm run build` regenera `index.html`, `assets/dist/app.min.js` y `assets/dist/app.min.css`.
3. Subí `index.html`, los parciales y `assets/dist/` juntos. GitHub Pages sigue sirviendo el `index.html` estático.

`npm run check` verifica que `index.html` coincida con `src/` (útil antes de un commit o en CI).

## Reglas

- La directiva va **sola en su línea**: `<!--@include sections/02-hero.html-->`.
- Para agregar una sección: creá el archivo en `partials/sections/` y sumá su directiva en `index.template.html` en la posición deseada.
- Los parciales se insertan tal cual (sin variables ni lógica); el resultado es el HTML final byte a byte.
