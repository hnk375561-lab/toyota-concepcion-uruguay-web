// @ts-check
/** Validador Nu (W3C) sobre lo que se publica: index.html y 404.html. 0 errores. */
import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SITE = resolve(ROOT, process.env.SITE_DIR || 'dist');
const VNU = resolve(ROOT, 'node_modules/vnu-jar/build/dist/vnu.jar');
const allow = JSON.parse(readFileSync(resolve(ROOT, 'tests/support/vnu-allowlist.json'), 'utf8')).errores_permitidos;

test.describe.configure({ mode: 'serial' });

async function validar(archivo) {
  expect(existsSync(archivo), `existe ${archivo} (corré antes: bash scripts/build.sh)`).toBe(true);
  let stdout = '';
  try {
    ({ stdout } = await run('java', ['-jar', VNU, '--format', 'json', '--stdout', archivo], { maxBuffer: 64 * 1024 * 1024, timeout: 120_000 }));
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('Falta Java en el PATH (el validador Nu lo necesita).');
    stdout = err.stdout || ''; // vnu sale con código 1 cuando hay errores
    if (!stdout) throw err;
  }
  const mensajes = JSON.parse(stdout).messages;
  const errores = mensajes.filter((m) => m.type === 'error' || m.subType === 'fatal');
  const reales = errores.filter((m) => !allow.some((a) => new RegExp(a.patron, 's').test(m.message)));
  const avisos = mensajes.filter((m) => m.type === 'info' && m.subType === 'warning');
  return { errores, reales, avisos };
}

const fmt = (m) => `línea ${m.lastLine ?? '?'}: ${m.message}`;

for (const nombre of ['index.html', '404.html']) {
  test(`${nombre}: 0 errores de HTML`, async () => {
    test.setTimeout(150_000);
    const { errores, reales, avisos } = await validar(resolve(SITE, nombre));
    if (avisos.length) test.info().annotations.push({ type: 'vnu-avisos', description: avisos.map(fmt).join(' | ') });
    if (errores.length !== reales.length) {
      test.info().annotations.push({ type: 'vnu-falsos-positivos-permitidos', description: `${errores.length - reales.length} (ver tests/support/vnu-allowlist.json)` });
    }
    expect(reales.map(fmt)).toEqual([]);
  });
}
