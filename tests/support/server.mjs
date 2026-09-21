#!/usr/bin/env node
/**
 * Servidor estático mínimo para los tests. Sirve dist/ (lo mismo que se publica).
 *
 * Imita a GitHub Pages en lo que importa para medir:
 *   - gzip / brotli para texto (los presupuestos de Lighthouse se miden con compresión),
 *   - Cache-Control público de 10 minutos,
 *   - 404 real que devuelve 404.html.
 *
 * Variables: PORT (8000), SITE_DIR (dist), HOST (127.0.0.1).
 * Sin dependencias: solo módulos nativos de Node.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { brotliCompressSync, gzipSync, constants as zc } from 'node:zlib';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SITE = resolve(ROOT, process.env.SITE_DIR || 'dist');
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg', '.ico']);
const cache = new Map(); // ruta -> { body, br, gz, mtimeMs }

async function load(file) {
  const { mtimeMs } = await stat(file);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit;
  const body = await readFile(file);
  const entry = { body, mtimeMs, br: null, gz: null };
  if (COMPRESSIBLE.has(extname(file)) && body.length > 1024) {
    entry.br = brotliCompressSync(body, { params: { [zc.BROTLI_PARAM_QUALITY]: 5 } });
    entry.gz = gzipSync(body, { level: 6 });
  }
  cache.set(file, entry);
  return entry;
}

function resolvePath(urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }
  const abs = normalize(join(SITE, rel));
  if (abs !== SITE && !abs.startsWith(SITE + sep)) return null; // path traversal
  return abs;
}

async function send(req, res, file, status) {
  const ext = extname(file);
  const entry = await load(file);
  const accept = String(req.headers['accept-encoding'] || '');
  let body = entry.body;
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=600',
    'Vary': 'Accept-Encoding',
    'X-Content-Type-Options': 'nosniff',
  };
  if (entry.br && /\bbr\b/.test(accept)) { body = entry.br; headers['Content-Encoding'] = 'br'; }
  else if (entry.gz && /\bgzip\b/.test(accept)) { body = entry.gz; headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    const { pathname } = new URL(req.url || '/', 'http://localhost');
    let file = resolvePath(pathname);
    if (file === null) { res.writeHead(400); return res.end('Bad request'); }
    if (pathname.endsWith('/')) file = join(file, 'index.html');
    let ok = false;
    try { ok = (await stat(file)).isFile(); } catch { ok = false; }
    if (ok) return await send(req, res, file, 200);
    const notFound = join(SITE, '404.html');
    if (existsSync(notFound)) return await send(req, res, notFound, 404);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(err && err.message || err));
  }
});

if (!existsSync(join(SITE, 'index.html'))) {
  console.error(`[server] No existe ${join(SITE, 'index.html')}. Corré antes: bash scripts/build.sh`);
  process.exit(1);
}
server.listen(PORT, HOST, () => console.log(`[server] ${SITE} → http://${HOST}:${PORT}/`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
