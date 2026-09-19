// Genera, a partir de las fuentes:
//   - index.html            <- src/index.template.html + src/partials/**  (directivas <!--@include ruta-->)
//   - assets/dist/app.min.* <- assets/js/*.js y assets/css/*.css
// Uso: npm install && npm run build   (las fuentes NO se tocan)
//      npm run check                  (falla si index.html no coincide con src/; no escribe nada)
import { transformSync } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";

// Orden identico al que tenian los <script defer> en index.html.
const JS = [
  "analytics", "lenis-loader", "gsap-flip-loader", "scroll-helper", "scroll-restoration",
  "app-core", "favorites", "used-interest-memory", "gama-expansion", "motion-foundation",
  "motion-gsap", "page-health-check", "rive-vehicle-compare", "tel-link-copy",
  "structural-visibility-guard", "location-status", "contact-form", "service-booking",
];
const CSS = ["fonts", "style"]; // fonts.css primero

const read = (p) => readFileSync(p, "utf8");

// ---- HTML: ensambla index.html desde la plantilla y los parciales ----
// La directiva debe ir sola en su línea; el parcial reemplaza la línea completa (sin agregar saltos).
const INCLUDE = /^[ \t]*<!--@include ([\w./-]+)-->[ \t]*$/gm;
const html = read("src/index.template.html").replace(INCLUDE, (_, file) => {
  const path = `src/partials/${file}`;
  if (!existsSync(path)) { console.error(`Falta el parcial: ${path}`); process.exit(1); }
  return read(path);
});
if (process.argv.includes("--check")) {
  if (read("index.html") !== html) { console.error("index.html no coincide con src/. Ejecutá: npm run build"); process.exit(1); }
  console.log("index.html coincide con src/ (OK)"); process.exit(0);
}
writeFileSync("index.html", html);
console.log(`index.html: ${(html.length / 1024).toFixed(1)} KB desde src/index.template.html + parciales`);

mkdirSync("assets/dist", { recursive: true });
const report = (name, raw, out) =>
  console.log(`${name}: ${(raw / 1024).toFixed(1)} KB -> ${(out.length / 1024).toFixed(1)} KB (gzip ${(gzipSync(out).length / 1024).toFixed(1)} KB)`);

let rawJs = 0;
const js = JS.map((n) => {
  const src = read(`assets/js/${n}.js`); rawJs += src.length;
  return transformSync(src, { minify: true, target: "es2018", legalComments: "none" }).code.trim();
}).join(";\n");
writeFileSync("assets/dist/app.min.js", js); report("app.min.js", rawJs, js);

let rawCss = 0;
const css = CSS.map((n) => {
  const src = read(`assets/css/${n}.css`); rawCss += src.length;
  return transformSync(src, { loader: "css", minify: true, legalComments: "none" }).code;
}).join("");
writeFileSync("assets/dist/app.min.css", css); report("app.min.css", rawCss, css);
