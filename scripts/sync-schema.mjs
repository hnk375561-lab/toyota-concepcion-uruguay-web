// scripts/sync-schema.mjs
//
// Uso:
//   node scripts/sync-schema.mjs hilux.html
//   node scripts/sync-schema.mjs hilux.html sw4.html corolla.html
//   node scripts/sync-schema.mjs            -> sincroniza el slug.html de cada modelo en data/models.json que exista en disco
//
// Lee el FAQ visible y el breadcrumb de cada archivo y reescribe el bloque
// JSON-LD entre los markers AUTO:FAQPAGE / AUTO:BREADCRUMB. Es idempotente:
// correrlo dos veces seguidas no duplica nada, solo actualiza el contenido.
// Corré esto cada vez que edites a mano las preguntas frecuentes de una ficha.

import fs from 'node:fs';
import path from 'node:path';
import { syncSchemaInHtml } from './lib/schema.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function resolveTargets(args) {
  if (args.length > 0) return args;
  const dataPath = path.join(root, 'data', 'models.json');
  if (!fs.existsSync(dataPath)) return [];
  const models = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return models
    .map((m) => `${m.slug}.html`)
    .filter((file) => fs.existsSync(path.join(root, file)));
}

const targets = resolveTargets(process.argv.slice(2));
if (targets.length === 0) {
  console.error('No hay archivos para sincronizar. Pasá uno o más nombres, ej: node scripts/sync-schema.mjs hilux.html');
  process.exit(1);
}

let exitCode = 0;
for (const file of targets) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${file}: no existe`);
    exitCode = 1;
    continue;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  try {
    const { html, faqCount, hasBreadcrumb } = syncSchemaInHtml(original);
    if (html !== original) {
      fs.writeFileSync(filePath, html);
      console.log(`✓ ${file}: actualizado (${faqCount} preguntas FAQ, breadcrumb ${hasBreadcrumb ? 'OK' : 'faltante'})`);
    } else {
      console.log(`= ${file}: ya estaba sincronizado (${faqCount} preguntas FAQ, breadcrumb ${hasBreadcrumb ? 'OK' : 'faltante'})`);
    }
    if (faqCount === 0) {
      console.warn(`  ⚠ ${file}: no se encontró ningún .faq-item — revisá si la ficha tiene preguntas frecuentes.`);
    }
    if (!hasBreadcrumb) {
      console.warn(`  ⚠ ${file}: no se pudo armar el BreadcrumbList (falta <link rel="canonical"> o el <span aria-current="page">).`);
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    exitCode = 1;
  }
}
process.exit(exitCode);
