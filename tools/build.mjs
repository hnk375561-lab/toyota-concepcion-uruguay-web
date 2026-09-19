// Genera assets/dist/app.min.css y assets/dist/app.min.js a partir de las fuentes.
// Uso: npm install && npm run build   (los archivos de assets/js y assets/css NO se tocan)
import { transformSync } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";

// Orden identico al que tenian los <script defer> en index.html.
const JS = [
  "analytics", "lenis-loader", "gsap-flip-loader", "scroll-helper", "scroll-restoration",
  "app-core", "favorites", "used-interest-memory", "gama-expansion", "motion-foundation",
  "motion-gsap", "page-health-check", "rive-vehicle-compare", "tel-link-copy",
  "structural-visibility-guard", "location-status", "contact-form",
];
const CSS = ["fonts", "style"]; // fonts.css primero

mkdirSync("assets/dist", { recursive: true });
const read = (p) => readFileSync(p, "utf8");
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
