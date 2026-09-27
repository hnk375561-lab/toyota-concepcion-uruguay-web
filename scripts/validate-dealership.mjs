import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'dealership.json'), 'utf8'));
const errors = [];
if (data.demo.official !== false) errors.push('demo.official debe ser false');
if (data.identity.cuit !== null) errors.push('CUIT debe permanecer null hasta confirmación');
if (data.hours.status !== 'public-source-needs-client-confirmation') errors.push('horarios deben quedar marcados para confirmación');
for (const [key, value] of Object.entries(data.contact)) {
  if (key !== 'source' && (!value || typeof value !== 'string')) errors.push(`contact.${key} no puede estar vacío`);
}
for (const page of ['index.html', 'hilux.html', 'templates/model.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  if (!html.includes('name="robots"')) errors.push(`${page}: falta robots`);
  if (!html.includes('rel="canonical"')) errors.push(`${page}: falta canonical`);
  if (!html.includes('rel="manifest"')) errors.push(`${page}: falta manifest`);
}
// Todos los enlaces a Google Maps de index.html deben abrir la ficha del negocio (mapsPlaceUrl),
// no una búsqueda por dirección en texto. El iframe (src) y Apple Maps quedan fuera de esta regla.
const placeUrl = data.location.mapsPlaceUrl;
if (!placeUrl || !placeUrl.startsWith('https://www.google.com/maps/place/')) errors.push('location.mapsPlaceUrl debe ser una URL https://www.google.com/maps/place/...');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mapsHrefs = [...indexHtml.matchAll(/\shref="(https:\/\/(?:www\.)?google\.com\/maps[^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
if (!mapsHrefs.length) errors.push('index.html: no hay enlaces a Google Maps');
for (const href of mapsHrefs) {
  if (href !== placeUrl) errors.push(`index.html: enlace a Google Maps que no apunta a mapsPlaceUrl: ${href.slice(0, 90)}`);
}
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join('\n'));
  process.exit(1);
}
console.log('Datos de dealership y metadatos SEO válidos.');
