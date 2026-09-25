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
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join('\n'));
  process.exit(1);
}
console.log('Datos de dealership y metadatos SEO válidos.');
