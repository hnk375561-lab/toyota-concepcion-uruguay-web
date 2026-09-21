#!/usr/bin/env node
/**
 * Presupuestos de Lighthouse sobre lo que se publica (dist/ servido por tests/support/server.mjs).
 *
 *   node tests/lighthouse/run.mjs
 *
 * Variables:
 *   BASE_URL   URL a medir (por defecto http://127.0.0.1:8000/; el servidor debe estar levantado
 *              o usar `npm test`, que lo levanta).
 *   LH_RUNS    corridas por form factor (3). Se evalúa la MEDIANA para absorber el ruido del runner.
 *   LH_FORM    "mobile", "desktop" o "both" (both).
 *   CHROME_PATH  binario de Chrome/Chromium; si falta se usa el de Playwright.
 *
 * Presupuestos: tests/lighthouse/budgets.json. Salida: build-report/lighthouse/*.html|json|md
 * Código de salida: 0 si todo cumple, 1 si algún presupuesto no se cumple, 2 si falló la medición.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from '@playwright/test';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const OUT = resolve(ROOT, 'build-report/lighthouse');
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 8000}/`;
const RUNS = Math.max(1, Number(process.env.LH_RUNS || 3));
const FORMS = process.env.LH_FORM && process.env.LH_FORM !== 'both' ? [process.env.LH_FORM] : ['mobile', 'desktop'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices'];
const CHROME_FLAGS = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run'];

const budgets = JSON.parse(await readFile(resolve(ROOT, 'tests/lighthouse/budgets.json'), 'utf8'));

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const p = chromium.executablePath();
  if (p && existsSync(p)) return p;
  throw new Error('No se encontró Chromium. Ejecutá `npx playwright install chromium` o definí CHROME_PATH.');
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function once(form) {
  const chrome = await launch({ chromePath: chromePath(), chromeFlags: CHROME_FLAGS, logLevel: 'silent' });
  try {
    const flags = { port: chrome.port, output: ['json', 'html'], onlyCategories: CATEGORIES, logLevel: 'error' };
    const result = await lighthouse(BASE_URL, flags, form === 'desktop' ? desktopConfig : undefined);
    if (!result || result.lhr.runtimeError) {
      throw new Error(`Lighthouse ${form}: ${result?.lhr?.runtimeError?.message || 'sin resultado'}`);
    }
    return result; // { lhr, report: [json, html] }
  } finally {
    await chrome.kill();
  }
}

const score = (lhr, cat) => Math.round((lhr.categories[cat]?.score ?? 0) * 100);

function failedAudits(lhr, cat) {
  return lhr.categories[cat].auditRefs
    .map((r) => lhr.audits[r.id])
    .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual')
    .map((a) => `${a.id} (${a.score})`);
}

await mkdir(OUT, { recursive: true });
const rows = [];
const failures = [];

for (const form of FORMS) {
  const runs = [];
  for (let i = 1; i <= RUNS; i++) {
    process.stdout.write(`[lighthouse] ${form} ${i}/${RUNS}… `);
    const r = await once(form);
    const s = Object.fromEntries(CATEGORIES.map((c) => [c, score(r.lhr, c)]));
    console.log(CATEGORIES.map((c) => `${c}=${s[c]}`).join(' '));
    runs.push({ r, s });
  }
  // Corrida representativa: la de performance mediana (es la que se guarda como reporte).
  const perfMedian = median(runs.map((x) => x.s.performance));
  const rep = runs.reduce((best, x) => (Math.abs(x.s.performance - perfMedian) < Math.abs(best.s.performance - perfMedian) ? x : best));
  await writeFile(resolve(OUT, `${form}.json`), rep.r.report[0]);
  await writeFile(resolve(OUT, `${form}.html`), rep.r.report[1]);

  for (const cat of CATEGORIES) {
    const med = median(runs.map((x) => x.s[cat]));
    const min = budgets[form][cat];
    const ok = med >= min;
    rows.push({ form, cat, med, all: runs.map((x) => x.s[cat]), min, ok });
    if (!ok) {
      failures.push(`${form}/${cat}: mediana ${med} < ${min} (corridas: ${runs.map((x) => x.s[cat]).join(', ')})`);
      const bad = failedAudits(rep.r.lhr, cat);
      if (bad.length) failures.push(`    auditorías bajo 1 en la corrida representativa: ${bad.join(', ')}`);
    }
  }
  const a = rep.r.lhr.audits;
  const vit = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index']
    .map((id) => `${id}: ${a[id]?.displayValue ?? '?'}`).join(' · ');
  console.log(`[lighthouse] ${form} métricas (corrida representativa): ${vit}`);
}

const md = [
  `| Form factor | Categoría | Mediana | Corridas | Mínimo | Estado |`,
  `|---|---|---|---|---|---|`,
  ...rows.map((x) => `| ${x.form} | ${x.cat} | ${x.med} | ${x.all.join(', ')} | ${x.min} | ${x.ok ? 'PASS' : 'FAIL'} |`),
  '',
].join('\n');
await writeFile(resolve(OUT, 'resumen.md'), md);
console.log('\n' + md);

if (failures.length) {
  console.error('Presupuestos NO cumplidos:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
console.log('Presupuestos de Lighthouse: OK');
