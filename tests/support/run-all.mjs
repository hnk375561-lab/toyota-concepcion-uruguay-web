#!/usr/bin/env node
/**
 * Orquestador de `npm test`.
 *
 *   npm test                          → build de dist/ + Playwright (e2e, axe, HTML) + Lighthouse
 *   npm test -- --skip-lighthouse     → sin presupuestos de Lighthouse
 *   npm test -- --only-lighthouse     → solo Lighthouse
 *   npm test -- --grep horarios       → el resto de los argumentos van a `playwright test`
 *
 * Variables: SKIP_BUILD=1 (usa el dist/ existente), PORT (8000), BASE_URL (probar otra URL, sin servidor local),
 *            LH_RUNS, LH_FORM (ver tests/lighthouse/run.mjs).
 * Corre todas las etapas aunque una falle y sale con 1 si alguna falló.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const args = process.argv.slice(2);
const skipLh = args.includes('--skip-lighthouse');
const onlyLh = args.includes('--only-lighthouse');
const pwArgs = args.filter((a) => a !== '--skip-lighthouse' && a !== '--only-lighthouse');
const PORT = String(process.env.PORT || 8000);
const external = !!process.env.BASE_URL;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const results = [];

const run = (name, cmd, cmdArgs, env = {}) => {
  console.log(`\n━━━ ${name} ━━━`);
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
  results.push({ name, ok: r.status === 0 });
  return r.status === 0;
};

let server = null;
const stopServer = () => { if (server && !server.killed) server.kill(); };
process.on('exit', stopServer);
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { stopServer(); process.exit(130); });

// 1) dist/
if (!external && process.env.SKIP_BUILD !== '1') {
  if (process.platform === 'win32') {
    console.error('En Windows corré `bash scripts/build.sh` (Git Bash/WSL) y luego SKIP_BUILD=1 npm test.');
    process.exit(1);
  }
  if (!run('Build de dist/', 'bash', ['scripts/build.sh'], { SKIP_CRAWL: '1' })) process.exit(1);
}
if (!external && !existsSync(resolve(ROOT, 'dist/index.html'))) {
  console.error('No existe dist/index.html.');
  process.exit(1);
}

// 2) servidor (compartido por Playwright y Lighthouse)
if (!external) {
  server = spawn(process.execPath, ['tests/support/server.mjs'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, PORT } });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    try { up = (await fetch(BASE_URL + '/')).ok; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!up) { console.error('El servidor de tests no arrancó.'); process.exit(1); }
}
const env = { BASE_URL, PORT };

// 3) etapas
if (!onlyLh) run('Playwright: e2e + axe + validador HTML', process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...pwArgs], env);
if (!skipLh) run('Lighthouse: presupuestos', process.execPath, ['tests/lighthouse/run.mjs'], env);

stopServer();
console.log('\n━━━ Resumen ━━━');
for (const r of results) console.log(`${r.ok ? '✔' : '✘'} ${r.name}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
