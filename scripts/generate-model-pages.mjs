import fs from 'node:fs';
import path from 'node:path';
import { syncSchemaInHtml } from './lib/schema.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const templatePath = path.join(root, 'templates', 'model.html');
const dataPath = path.join(root, 'data', 'models.json');

const template = fs.readFileSync(templatePath, 'utf8');
const models = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (!Array.isArray(models) || models.length === 0) throw new Error('data/models.json debe contener al menos un modelo');

const required = ['slug', 'slugJs', 'name', 'fullName', 'title', 'description', 'canonical', 'reviewedAt', 'image800', 'image480', 'image800Avif', 'image480Avif', 'configuration', 'transmission', 'drive', 'fuel', 'manufacturerUrl'];
const htmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const placeholders = [...template.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map(([, name]) => name);
const uniquePlaceholders = [...new Set(placeholders)];
const placeholderFor = {
  MODEL_NAME: 'name',
  MODEL_FULL_NAME: 'fullName',
  MODEL_SLUG: 'slug',
  MODEL_SLUG_JS: 'slugJs',
  MODEL_TITLE: 'title',
  MODEL_DESCRIPTION: 'description',
  MODEL_CANONICAL: 'canonical',
  MODEL_REVIEWED_AT: 'reviewedAt',
  MODEL_IMAGE_800_WEBP: 'image800',
  MODEL_IMAGE_480_WEBP: 'image480',
  MODEL_IMAGE_800_AVIF: 'image800Avif',
  MODEL_IMAGE_480_AVIF: 'image480Avif',
  MODEL_CONFIGURATION: 'configuration',
  MODEL_TRANSMISSION: 'transmission',
  MODEL_DRIVE: 'drive',
  MODEL_FUEL: 'fuel',
  MODEL_MANUFACTURER_URL: 'manufacturerUrl'
};

for (const placeholder of uniquePlaceholders) {
  if (!placeholderFor[placeholder]) throw new Error(`Placeholder no soportado en la plantilla: ${placeholder}`);
}
for (const model of models) {
  for (const field of required) {
    if (typeof model[field] !== 'string' || !model[field].trim()) throw new Error(`${model.slug ?? '(sin slug)'}: falta ${field}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(model.slug)) throw new Error(`Slug inválido: ${model.slug}`);
  // Fichas escritas a mano (handAuthored: true): el build NO las regenera desde la plantilla.
  // Sin este freno, `scripts/build.sh` pisaba la ficha real con los placeholders de templates/model.html.
  if (model.handAuthored === true) {
    const manual = path.join(root, `${model.slug}.html`);
    if (!fs.existsSync(manual)) throw new Error(`${model.slug}: handAuthored=true pero falta ${model.slug}.html en la raíz`);
    const html = fs.readFileSync(manual, 'utf8');
    const pend = html.match(/\[Completar[^\]]*\]|\{\{[A-Z0-9_]+\}\}/g);
    if (pend) throw new Error(`${model.slug}.html tiene placeholders sin completar: ${[...new Set(pend)].join(', ')}`);
    console.log(`  · ${model.slug}: handAuthored — se conserva ${model.slug}.html tal cual (no se regenera).`);
    continue;
  }
  let html = template;
  for (const placeholder of uniquePlaceholders) {
    const field = placeholderFor[placeholder];
    html = html.replaceAll(`{{${placeholder}}}`, htmlEscape(model[field]));
  }
  const leftovers = html.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftovers) throw new Error(`${model.slug}: placeholders sin resolver: ${leftovers.join(', ')}`);
  const { html: htmlWithSchema, faqCount, hasBreadcrumb } = syncSchemaInHtml(html);
  html = htmlWithSchema;
  if (!hasBreadcrumb) console.warn(`  ⚠ ${model.slug}: no se pudo armar el BreadcrumbList.`);
  console.log(`  · ${model.slug}: ${faqCount} preguntas FAQ heredadas de la plantilla (revisar/adaptar el contenido del FAQ y de las secciones marcadas "ADAPTAR POR MODELO").`);
  const output = path.join(root, `${model.slug}.html`);
  fs.writeFileSync(output, html.endsWith('\n') ? html : `${html}\n`);
  console.log(`${path.relative(root, output)} (${Buffer.byteLength(html)} bytes)`);
}
