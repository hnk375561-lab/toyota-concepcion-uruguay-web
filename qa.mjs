#!/usr/bin/env node
/**
 * qa.mjs — Auditoría completa y automática del sitio. UN SOLO COMANDO:
 *
 *     node qa.mjs
 *
 * Todo lo hace solo: instala lo que falte (Playwright + Chromium, una única vez), levanta un
 * servidor local con lo que se publica, abre el sitio en 10 tamaños de pantalla (de celular chico
 * a Full HD), toca TODO (links, botones, tarjetas, menús, pestañas, filtros, formularios), verifica
 * a dónde va cada cosa (WhatsApp con número y mensaje, teléfonos, mails, mapas, anclas, páginas
 * internas, links externos), revisa el responsive (scroll horizontal, cortes, botones chicos,
 * imágenes rotas, barrido de 27 anchos) y deja un reporte HTML con capturas. Al final lo abre.
 *
 * Opciones (todas opcionales):
 *   --quick          solo 3 tamaños (390, 768, 1440): unos minutos menos
 *   --widths=390,1440  elegir exactamente qué anchos probar
 *   --url=https://…  auditar un sitio publicado en vez del local (GitHub Pages, preview)
 *   --headed         ver el navegador trabajando
 *   --no-open        no abrir el reporte al terminar
 *
 * Salida: qa-report/index.html (+ resultados.json y resultados.md). Código de salida 1 si hay fallas.
 * No modifica el sitio. Solo crea las carpetas .qa/ (dependencias) y qa-report/.
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';

const ROOT = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => (argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
if (flag('help')) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]); process.exit(0); }
const REMOTE = opt('url').replace(/\/+$/, '');
const QUICK = false; // default: todos los 10 anchos (usa --quick para solo 3)
const REPORT = join(ROOT, 'qa-report');
const T0 = Date.now();
const secs = () => `${Math.round((Date.now() - T0) / 1000)}s`;

// ─────────────────────────── configuración ───────────────────────────
const ALL_VIEWPORTS = [
  { name: '320 · celular chico', w: 320, h: 568 },
  { name: '360 · Android', w: 360, h: 740 },
  { name: '390 · iPhone', w: 390, h: 844 },
  { name: '430 · iPhone Max', w: 430, h: 932 },
  { name: '600 · tablet chica', w: 600, h: 960 },
  { name: '768 · iPad vertical', w: 768, h: 1024 },
  { name: '1024 · iPad horizontal', w: 1024, h: 768 },
  { name: '1280 · notebook', w: 1280, h: 720 },
  { name: '1440 · desktop', w: 1440, h: 900 },
  { name: '1920 · Full HD', w: 1920, h: 1080 },
];
const WIDTHS = opt('widths').split(',').map(Number).filter(Boolean);
const VIEWPORTS = WIDTHS.length ? WIDTHS.map((w) => ALL_VIEWPORTS.find((v) => v.w === w) || { name: `${w} · personalizado`, w, h: w < 700 ? 844 : 900 }) : QUICK ? ALL_VIEWPORTS.filter((v) => [390, 768, 1440].includes(v.w)) : ALL_VIEWPORTS;
const FULL_FORM_SWEEP = new Set([390, 1440]); // en estos anchos se prueban TODOS los motivos del formulario
const SWEEP = [320, 340, 360, 375, 390, 414, 430, 480, 540, 600, 640, 700, 760, 761, 768, 820, 900, 1024, 1100, 1180, 1280, 1366, 1440, 1536, 1680, 1920, 2560];
const SEL = 'a[href],button,summary,[role=button],[role=tab],[role=menuitem],[role=link],input[type=submit],input[type=button],[onclick],area[href],img[onclick],[data-action]';
const MAX_FAIL_SHOTS = 25;

// ─────────────────────────── instalación automática ───────────────────────────
function sh(cmd, args, cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}
async function loadPlaywright() {
  const qaDir = join(ROOT, '.qa');
  const resolvers = () => [createRequire(join(ROOT, 'x.js')), createRequire(join(qaDir, 'x.js'))];
  const find = async () => {
    for (const r of resolvers()) for (const name of ['playwright-core', 'playwright']) {
      try {
        const pkg = r.resolve(`${name}/package.json`);
        const mod = await import(pathToFileURL(r.resolve(name)).href);
        const chromium = mod.chromium ?? mod.default?.chromium;
        if (chromium) return { chromium, cli: join(dirname(pkg), 'cli.js') };
      } catch { /* siguiente */ }
    }
    return null;
  };
  let pw = await find();
  if (!pw) {
    console.log('▶ Primera vez: instalando Playwright (una sola vez, ~1-2 min)…');
    mkdirSync(qaDir, { recursive: true });
    if (!existsSync(join(qaDir, 'package.json'))) writeFileSync(join(qaDir, 'package.json'), '{"name":"qa","private":true}');
    if (!sh('npm', ['install', 'playwright-core@1.56.0', '--no-audit', '--no-fund', '--loglevel=error'], qaDir)) fatal('No se pudo instalar Playwright (¿hay internet?).');
    pw = await find();
    if (!pw) fatal('Playwright quedó instalado pero no se pudo cargar.');
  }
  return pw;
}
const fatal = (m) => { console.error(`\n✘ ${m}`); process.exit(2); };
async function launchBrowser(pw) {
  const launchOpts = {
    headless: !flag('headed'),
    args: ['--no-sandbox', ...(process.env.QA_ARGS ? process.env.QA_ARGS.split(' ') : [])],
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  };
  try { return await pw.chromium.launch(launchOpts); } catch (e) {
    if (!/Executable doesn't exist|browserType\.launch/i.test(String(e.message))) throw e;
    console.log('▶ Descargando Chromium (una sola vez, ~150 MB)…');
    if (!sh(process.execPath, [pw.cli, 'install', 'chromium'])) fatal('No se pudo descargar Chromium.');
    return await pw.chromium.launch(launchOpts);
  }
}

// ─────────────────────────── servidor local ───────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
// Solo lo que scripts/build.sh publica: *.html de la raíz, toyota-sharp-assets/, robots.txt y sitemap.xml.
const publicPath = (rel) => /^[^/]+\.html$/.test(rel) || /^toyota-sharp-assets\//.test(rel) || /^(robots\.txt|sitemap\.xml|favicon\.ico|\.nojekyll)$/.test(rel);
// El sitio se publica en https://usuario.github.io/<repo>/: links como "/<repo>/" deben resolverse igual en local.
function basePath() {
  try { const h = readFileSync(join(ROOT, 'index.html'), 'utf8'); const c = (h.match(/rel="canonical"[^>]*href="([^"]+)"/) || h.match(/href="([^"]+)"[^>]*rel="canonical"/) || [])[1]; const u = new URL(c); return u.hostname.endsWith('github.io') ? u.pathname.split('/')[1] || '' : ''; } catch { return ''; }
}
const BASE = basePath();
function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      if (BASE && (rel === BASE || rel.startsWith(BASE + '/'))) rel = rel.slice(BASE.length).replace(/^\/+/, '');
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      let file = normalize(join(ROOT, rel));
      if (!existsSync(file) && !extname(rel) && existsSync(file + '.html')) { file += '.html'; rel += '.html'; } // como GitHub Pages
      if (file.startsWith(ROOT + sep) && publicPath(rel) && existsSync(file)) {
        res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
        return res.end(await readFile(file));
      }
      const nf = join(ROOT, '404.html');
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(existsSync(nf) ? await readFile(nf) : 'no encontrado');
    } catch { res.writeHead(500); res.end('error'); }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

// ─────────────────────────── resultados ───────────────────────────
const results = [];
const failShots = {};
const add = (vp, page, type, name, status, detail = '', shot = '') => results.push({ vp, page, type, name, status, detail: String(detail), shot });
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const CT = { stylesheet: 'text/css', script: 'text/javascript', font: 'font/woff2', image: 'image/gif' };
const parseWa = (u) => { try { const x = new URL(u); return { phone: x.pathname.replace(/\D/g, '') || x.searchParams.get('phone') || '', text: x.searchParams.get('text') || '' }; } catch { return { phone: '', text: '' }; } };
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
const plain = (u) => { try { return decodeURIComponent(String(u).replace(/\+/g, ' ')); } catch { return String(u); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readExpected() {
  const f = join(ROOT, 'README.md');
  const t = existsSync(f) ? readFileSync(f, 'utf8') : '';
  const addr = (t.match(/Direcci[oó]n[^\n]*?`([^`]+)`/) || [])[1] || '';
  return { wa: new Set(t.match(/\b549\d{10}\b/g) || []), tel: new Set((t.match(/tel:\+54\d{9,12}/g) || []).map((x) => x.slice(4))), addr };
}
const EXPECTED = readExpected();

// ─────────────────────────── código que corre dentro de la página ───────────────────────────
const INIT_SCRIPT = `(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} window.__qa = { mut: 0 }; try { new MutationObserver(m => { window.__qa.mut += m.length; }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true }); } catch (e) {} })();`;

const INVENTORY = (SELECTOR) => {
  const out = []; const seen = new Set();
  const push = (el, pointer) => {
    if (seen.has(el)) return; seen.add(el);
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const i = out.length;
    el.setAttribute('data-qa', String(i));
    const label = ((el.innerText || el.value || '').replace(/\s+/g, ' ').trim()) || el.getAttribute('aria-label') || el.title || (el.querySelector('img') && el.querySelector('img').alt) || (el.id ? '#' + el.id : '');
    const sec = el.closest('header,footer,section[id],main > [id],[role=dialog]');
    const cn = typeof el.className === 'string' ? el.className : '';
    out.push({
      i, tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || '', text: label.slice(0, 60), href: el.getAttribute('href'), target: el.getAttribute('target') || '',
      section: sec ? (sec.id || sec.tagName.toLowerCase()) : '', cls: cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.'),
      w: Math.round(r.width), h: Math.round(r.height), inline: cs.display === 'inline' && !!el.closest('p,li,small,figcaption,td'),
      vis: r.width > 0 && r.height > 0 && (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : true),
      disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true', pointer,
    });
  };
  document.querySelectorAll(SELECTOR).forEach((el) => push(el, false));
  document.body.querySelectorAll('*').forEach((el) => {
    if (seen.has(el) || el.closest(SELECTOR) || !el.parentElement) return;
    if (getComputedStyle(el).cursor === 'pointer' && getComputedStyle(el.parentElement).cursor !== 'pointer') push(el, true);
  });
  return out;
};

const SNAP = () => ({
  url: location.href, path: location.pathname, y: Math.round(scrollY), mut: window.__qa ? window.__qa.mut : 0,
  aria: [...document.querySelectorAll('[aria-expanded],[aria-selected],[aria-pressed],[aria-checked],[open],[hidden]')].map((e) => (e.getAttribute('aria-expanded') || '') + (e.getAttribute('aria-selected') || '') + (e.getAttribute('aria-pressed') || '') + (e.hasAttribute('open') ? 'o' : '') + (e.hasAttribute('hidden') ? 'h' : '')).join(''),
});

const LANDING = (id) => {
  if (!id) return { exists: true, vis: true, ok: scrollY < 8, why: 'no volvió al inicio' };
  const t = document.getElementById(id) || document.getElementsByName(id)[0];
  if (!t && id === 'top') return { exists: true, vis: true, ok: scrollY < 8, top: 0, headTop: 0, hb: 0, vh: innerHeight };
  if (!t) return { exists: false };
  const vis = t.checkVisibility({ checkVisibilityCSS: true });
  let hb = 0;
  for (const c of document.querySelectorAll('header,[class*=sticky],[class*=fixed],nav')) {
    const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
    if ((cs.position === 'fixed' || cs.position === 'sticky') && r.top <= 2 && r.height > 0) hb = Math.max(hb, r.bottom);
  }
  const hd = t.querySelector('h1,h2,h3') || t; const r = t.getBoundingClientRect(); const rh = hd.getBoundingClientRect(); const vh = innerHeight;
  const atBottom = scrollY + vh >= document.documentElement.scrollHeight - 4;
  const inView = (top) => top >= hb - 4 && top <= vh - 40;
  const ok = vis && (inView(rh.top) || inView(r.top) || (r.top < hb && r.bottom > hb + 80) || (atBottom && r.bottom > hb + 40));
  return { exists: true, vis, ok, top: Math.round(r.top), headTop: Math.round(rh.top), hb: Math.round(hb), vh };
};

const LAYOUT = () => {
  const vw = document.documentElement.clientWidth; const docW = document.documentElement.scrollWidth;
  const sel = (el) => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 60);
  const clipped = (el) => { for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX) && a.getBoundingClientRect().right <= vw + 1 && a.getBoundingClientRect().left >= -1) return true; } return false; };
  const culprits = [];
  document.body.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || (r.right <= vw + 1 && r.left >= -1)) return;
    if (getComputedStyle(el).position === 'fixed' || !el.checkVisibility({ checkVisibilityCSS: true }) || clipped(el)) return;
    culprits.push({ s: sel(el), right: Math.round(r.right), left: Math.round(r.left), t: (el.innerText || '').trim().slice(0, 30) });
  });
  culprits.sort((a, b) => b.right - a.right);
  const tiny = []; const small = []; const broken = [];
  document.querySelectorAll('img').forEach((im) => { if (im.checkVisibility && im.checkVisibility() && im.complete && im.naturalWidth === 0) broken.push((im.currentSrc || im.src).split('/').pop().slice(0, 50)); });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const seen = new Set();
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const p = n.parentElement; if (!p || !n.textContent.trim() || seen.has(p) || !p.checkVisibility || !p.checkVisibility()) continue; seen.add(p);
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName)) continue;
    const fs = parseFloat(getComputedStyle(p).fontSize); if (fs < 11) tiny.push(sel(p) + ' ' + fs + 'px');
  }
  return { vw, docW, hasScroll: docW > vw + 1, culprits: culprits.slice(0, 6), nCulprits: culprits.length, tiny: tiny.slice(0, 5), nTiny: tiny.length, broken };
};

const DATA = () => ({
  tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href').slice(4)),
  wa: [...document.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp.com"]')].map((a) => a.getAttribute('href')),
  mail: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href').slice(7)),
  maps: [...document.querySelectorAll('a[href*="maps"],iframe[src*="maps"]')].map((e) => e.getAttribute('href') || e.getAttribute('src')),
  jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
  text: document.body.innerText, title: document.title, lang: document.documentElement.lang,
});

const FORMS = () => [...document.forms].map((f, i) => {
  f.setAttribute('data-qf', String(i));
  const fields = [...f.querySelectorAll('input,select,textarea')].filter((e) => !['hidden', 'submit', 'button', 'reset', 'image'].includes(e.type)).map((e, j) => {
    e.setAttribute('data-qff', i + '-' + j);
    return { j, tag: e.tagName.toLowerCase(), type: e.type, id: e.id, name: e.name, ph: e.placeholder || '', im: e.inputMode || '', ml: e.maxLength > 0 ? e.maxLength : 0, req: e.required, opts: e.tagName === 'SELECT' ? [...e.options].map((o) => o.value || o.text) : [], vis: e.checkVisibility ? e.checkVisibility() : true };
  });
  const btn = f.querySelector('[type=submit],button:not([type=button])');
  return { i, id: f.id || ('form' + i), fields, hasBtn: !!btn, btnText: btn ? btn.innerText.trim().slice(0, 40) : '' };
});

// ─────────────────────────── auditor por (viewport × página) ───────────────────────────
const TYPE = { tel: 'Teléfono', mail: 'Mail', wa: 'WhatsApp', ancla: 'Ancla', hash: 'Botón', pagina: 'Página interna', externo: 'Link externo', boton: 'Botón', submit: 'Botón', desplegable: 'Desplegable', pointer: 'Tarjeta' };
function classify(el, origin) {
  if (el.pointer) return 'pointer';
  const h = (el.href || '').trim();
  if (/^tel:/i.test(h)) return 'tel';
  if (/^mailto:/i.test(h)) return 'mail';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|wa\.link)/i.test(h)) return 'wa';
  if (h.startsWith('#')) return h.length > 1 && !/[/?]/.test(h) ? 'ancla' : 'hash';
  if (/^https?:/i.test(h)) { try { return new URL(h).origin === origin ? 'pagina' : 'externo'; } catch { return 'boton'; } }
  if (h && !/^javascript:/i.test(h)) return 'pagina';
  return el.tag === 'summary' ? 'desplegable' : el.type === 'submit' ? 'submit' : 'boton';
}

class Auditor {
  constructor(ctx, vp, origin, pageName, url, shared) {
    Object.assign(this, { ctx, vp, origin, pageName, url, shared });
    this.touch = vp.w <= 1024; this.is404 = pageName === '404.html'; this.popups = []; this.noise = 0; this.hidden = 0; this.inv = []; this.docStatus = 0; this.seenNet = new Set();
  }
  rep(type, name, status, detail = '', shot = '') { add(this.vp.name, this.pageName, type, name, status, detail, shot); }
  async init() {
    const page = this.page = await this.ctx.newPage();
    this.ctx.on('page', (p) => { if (p !== page) this.popups.push(p); });
    page.on('console', (m) => { if (!this.is404 && m.type() === 'error' && !/favicon/.test(m.location().url || '') && (!m.location().url || m.location().url.startsWith(this.origin))) this.rep('Consola', m.text().slice(0, 140), 'fail', '❌ ERROR en consola: ' + m.text().slice(0, 100)); });
    page.on('pageerror', (e) => !this.is404 && this.rep('Consola', String(e.message).slice(0, 140), 'fail', 'excepción de JavaScript'));
    page.on('response', (r) => {
      if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) this.docStatus = r.status();
      const u = r.url();
      if (!this.is404 && r.status() >= 400 && u.startsWith(this.origin) && !/favicon\.ico$/.test(u) && !this.seenNet.has(u)) { this.seenNet.add(u); if (!(r.request().isNavigationRequest() && r.frame() === page.mainFrame())) this.rep('Red', u.replace(this.origin, ''), 'fail', `HTTP ${r.status()} al cargar un recurso`); }
    });
  }
  async settle(max = 1500) {
    let last = -1, same = 0; const t = Date.now();
    while (Date.now() - t < max && same < 2) { const m = await this.page.evaluate(() => (window.__qa ? window.__qa.mut : 0)).catch(() => -1); same = m === last ? same + 1 : 0; last = m; await sleep(70); }
  }
  async load(scrollPass = false) {
    await this.page.goto(this.url, { waitUntil: 'load', timeout: 30000 });
    if (scrollPass) {
      await this.page.evaluate(async () => { const s = Math.max(300, innerHeight * 0.7); for (let y = 0; y < document.documentElement.scrollHeight; y += s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
      await sleep(250);
    }
    await this.settle();
    this.inv = await this.page.evaluate(INVENTORY, SEL);
    return this.inv;
  }
  async reset(hard = true) {
    if (!hard) { await this.page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); history.replaceState(null, '', location.pathname + location.search); scrollTo(0, 0); }); return; }
    await this.page.goto(this.url, { waitUntil: 'load', timeout: 30000 }); // carga limpia (el init script vacía el storage)
    await this.settle();
    this.inv = await this.page.evaluate(INVENTORY, SEL);
  }
  resolve(el) {
    const same = (x) => x && x.href === el.href && x.text === el.text && x.tag === el.tag;
    if (same(this.inv[el.i])) return el.i;
    const f = this.inv.find((x) => same(x) && x.section === el.section);
    return f ? f.i : -1;
  }
  async act(loc) { return this.touch ? loc.tap({ timeout: 3500 }) : loc.click({ timeout: 3500 }); }
  async shot(label, sel) {
    const n = (failShots[this.vp.name] = (failShots[this.vp.name] || 0) + 1);
    if (n > MAX_FAIL_SHOTS) return '';
    const file = `fallas/${this.vp.w}-${this.pageName.replace(/\W+/g, '_')}-${n}.jpg`;
    try {
      if (sel) await this.page.evaluate((s) => { const e = document.querySelector(s); if (e) { e.scrollIntoView({ block: 'center' }); e.style.outline = '4px solid #ff2d55'; e.style.outlineOffset = '2px'; } }, sel);
      await this.page.screenshot({ path: join(REPORT, file), type: 'jpeg', quality: 60 });
      return file;
    } catch { return ''; }
  }
  // Abre menús/desplegables/pestañas que esconden el elemento (burger, <details>, tabs) igual que un usuario.
  async reveal(sel) {
    for (let round = 0; round < 3; round++) {
      const vis = await this.page.evaluate((s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().width > 0 && e.checkVisibility({ checkVisibilityCSS: true }); }, sel);
      if (vis) return true;
      const has = await this.page.evaluate((s) => {
        document.querySelectorAll('[data-qa-trig]').forEach((x) => x.removeAttribute('data-qa-trig'));
        const e = document.querySelector(s); if (!e) return false;
        for (let a = e.parentElement; a; a = a.parentElement) {
          let t = null;
          if (a.tagName === 'DETAILS' && !a.open) t = a.querySelector(':scope > summary');
          if (!t && a.id) t = [...document.querySelectorAll(`[aria-controls~="${a.id}"]`)].find((b) => b.getAttribute('aria-expanded') !== 'true' && b.checkVisibility && b.checkVisibility({ checkVisibilityCSS: true }));
          if (t) { t.setAttribute('data-qa-trig', '1'); return true; }
        }
        return false;
      }, sel);
      if (!has) return false;
      try { await this.act(this.page.locator('[data-qa-trig="1"]').first()); } catch { return false; }
      await sleep(260);
    }
    return false;
  }
  async takePopups() {
    await sleep(120);
    const list = this.popups.splice(0);
    const out = [];
    for (const p of list) {
      try { await p.waitForURL((u) => u.href !== 'about:blank', { timeout: 1500 }); } catch { /* sigue */ }
      out.push(p.url()); await p.close().catch(() => {});
    }
    return out;
  }
  checkWa(url) {
    const { phone, text } = parseWa(url); const bad = [];
    if (!phone) bad.push('sin número'); else if (EXPECTED.wa.size && !EXPECTED.wa.has(phone)) bad.push(`número ${phone} no figura en el README`);
    if (!text.trim()) bad.push('sin mensaje precargado'); else if (/undefined|null|\[object|�/.test(text)) bad.push('mensaje con datos rotos: ' + text.slice(0, 40));
    return { ok: !bad.length, phone, text, msg: bad.length ? bad.join('; ') : `→ ${phone} | “${text.slice(0, 55)}${text.length > 55 ? '…' : ''}”` };
  }

  // ───── un elemento ─────
  async testElement(el) {
    const kind = classify(el, this.origin); const type = TYPE[kind];
    const label = `${el.tag}${el.text ? ' “' + el.text + '”' : ''}${el.section ? '  [' + el.section + ']' : ''}`;
    const h = (el.href || '').trim();
    // En 404.html, ignorar links a GitHub Pages que no existen localmente
    if (this.is404 && kind === "pagina" && /^\/[a-z\-]+\/$/.test(h)) {
      return this.rep(type, label, "info", `link a GitHub Pages sin equivalente local (esperado): ${h}`);
    }
    if (kind === 'tel') { const ok = /^\+?\d{8,15}$/.test(h.slice(4)); const known = !EXPECTED.tel.size || EXPECTED.tel.has(h.slice(4)); return this.rep(type, label, ok && known ? 'ok' : 'fail', ok ? (known ? h : `${h} no figura en el README`) : `formato inválido: ${h}`); }
    if (kind === 'mail') return this.rep(type, label, /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/.test(h) ? 'ok' : 'fail', h);
    if (el.disabled) return this.rep(type, label, 'info', 'deshabilitado');
    if (kind === 'externo') this.shared.external.set(h, (this.shared.external.get(h) || new Set()).add(this.pageName));
    if (kind === 'ancla') {
      const id = decodeURIComponent(h.slice(1));
      const exists = id === 'top' || await this.page.evaluate((i) => !!(document.getElementById(i) || document.getElementsByName(i).length), id);
      if (!exists) return this.rep(type, label, 'fail', `${h} → el destino no existe en la página`, await this.shot(label, `[data-qa="${el.i}"]`));
    }
    const sel = `[data-qa="${el.i}"]`;
    let revealed = false;
    if (!el.vis) { if (!(await this.reveal(sel))) { this.hidden++; return; } revealed = true; }
    const loc = this.page.locator(sel);
    try { await loc.scrollIntoViewIfNeeded({ timeout: 2500 }); } catch { /* lo intenta igual */ }
    const before = await this.page.evaluate(SNAP);
    await this.page.evaluate(() => { window.__qa.mut = 0; });
    this.popups.length = 0; this.docStatus = 0;
    let err = null;
    try { await this.act(loc); } catch (e) {
      err = e;
      if (/saltar|skip|ir al contenido/i.test(el.text)) { try { await loc.focus(); await loc.click({ timeout: 2500, force: true }); err = null; } catch (e2) { err = e2; } } // "skip links": solo aparecen con foco
    }
    if (err) {
      const e = err;
      const why = /intercepts pointer/i.test(e.message) ? 'está tapado por otro elemento (no se puede tocar)' : /not visible|outside of the viewport/i.test(e.message) ? 'no es visible/tocable' : e.message.split('\n')[0].slice(0, 100);
      const shot = await this.shot(label, sel); this.rep(type, label, 'fail', why, shot); return this.reset();
    }
    const isAnchor = kind === 'ancla';
    if (isAnchor) { let y = -1; for (let k = 0; k < 12; k++) { const cy = await this.page.evaluate(() => Math.round(scrollY)); if (cy === y) break; y = cy; await sleep(110); } } else await sleep(420);
    const popups = await this.takePopups();
    const after = await this.page.evaluate(SNAP).catch(() => null);
    let status = 'ok', detail = '', reload = true;
    const offSite = !this.page.url().startsWith(this.origin);
    if (popups.length) {
      const u = popups[0];
      if (/wa\.me|whatsapp\.com/.test(u)) { const w = this.checkWa(u); status = w.ok ? 'ok' : 'fail'; detail = `abre WhatsApp ${w.msg}`; }
      else if (/maps/.test(u)) { const bad = EXPECTED.addr && !norm(plain(u)).includes(norm(EXPECTED.addr)); status = bad ? 'warn' : 'ok'; detail = `abre mapa: ${plain(u).slice(0, 90)}${bad ? ' (no menciona la dirección esperada)' : ''}`; }
      else { status = 'ok'; detail = `abre pestaña nueva: ${u.slice(0, 100)}`; }
    } else if (offSite) {
      const u = this.page.url(); status = 'ok'; detail = `navega a ${u.slice(0, 100)}`;
      if (/wa\.me|whatsapp\.com/.test(u)) { const w = this.checkWa(u); status = w.ok ? 'ok' : 'fail'; detail = `navega a WhatsApp ${w.msg}`; }
    } else if (!after) { status = 'fail'; detail = 'la página se rompió después del clic'; }
    else if (after.path !== before.path) {
      const title = await this.page.title().catch(() => '');
      if (this.docStatus >= 400) { status = 'fail'; detail = `${after.path} responde HTTP ${this.docStatus}`; } else if (!title.trim()) { status = 'warn'; detail = `navega a ${after.path} pero sin <title>`; } else detail = `navega a ${after.path} (“${title.slice(0, 40)}”)`;
    } else if (/#./.test(after.url) && (isAnchor || after.url !== before.url)) {
      const id = decodeURIComponent(after.url.split('#')[1]);
      const L = /[/?]/.test(id) ? null : await this.page.evaluate(LANDING, id);
      if (L && L.exists === false) { status = 'fail'; detail = `#${id}: destino inexistente`; }
      else if (L && !L.ok) { status = 'fail'; detail = !L.vis ? `#${id}: el destino queda oculto` : `#${id}: aterriza mal (top=${L.top}, título=${L.headTop}, header=${L.hb}, alto pantalla=${L.vh})`; }
      else { detail = L ? `#${id} ✔ aterriza bien (título a ${L.headTop}px, header ${L.hb}px)` : `abre ${after.url.split('#')[1]}`; reload = after.mut > Math.ceil(this.noise * 1.2) + 2 || after.aria !== before.aria; }
      if (!L) { const thr = Math.ceil(this.noise * 1.2) + 2; if (after.mut <= thr && after.aria === before.aria) { status = 'fail'; detail = 'sin efecto visible'; } }
    } else {
      const thr = Math.ceil(this.noise * 1.2) + 2; const fx = [];
      if (after.url !== before.url) fx.push('cambia la URL'); if (Math.abs(after.y - before.y) > 40) fx.push('hace scroll');
      if (after.mut > thr) fx.push(`cambia la página (+${after.mut} nodos)`); if (after.aria !== before.aria) fx.push('cambia un estado (abierto/activo)');
      if (fx.length) detail = fx.join(', '); else { status = 'fail'; detail = 'SIN EFECTO: se tocó y no pasó nada'; reload = false; }
    }
    const shot = status === 'fail' ? await this.shot(label, sel) : '';
    this.rep(type, label, status, detail, shot);
    if (reload || revealed || status === 'fail') await this.reset(); else await this.reset(false);
  }

  async testAll() {
    const list = this.inv.slice(); let n = 0;
    for (const el of list) {
      const idx = this.resolve(el);
      if (idx < 0) { this.rep('Botón', el.text || el.tag, 'warn', 'no se pudo reubicar después de recargar (contenido dinámico)'); continue; }
      if (process.env.QA_DEBUG) console.log(`      · ${this.vp.w} #${idx} ${el.tag} ${el.text.slice(0, 30)} ${(el.href || '').slice(0, 40)} (${secs()})`);
      try { await this.testElement({ ...el, i: idx }); } catch (e) { this.rep('Interno', el.text || el.tag, 'warn', 'error del auditor: ' + e.message.split('\n')[0].slice(0, 120)); try { await this.reset(); } catch { /* */ } }
      if (++n % 60 === 0) console.log(`   [${this.vp.name}] ${this.pageName}: ${n}/${list.length} elementos (${secs()})`);
    }
    if (this.hidden) this.rep('Botón', 'elementos ocultos en este ancho', 'info', `${this.hidden} elementos no se muestran a este tamaño (normal: p. ej. menú de escritorio en celular)`);
  }

  // ───── menú móvil / escritorio ─────
  async testMenu() {
    const r = await this.page.evaluate(() => {
      const t = [...document.querySelectorAll('header button[aria-controls],header [aria-expanded][aria-controls]')].find((b) => b.checkVisibility && b.checkVisibility({ checkVisibilityCSS: true }));
      const navVisible = [...document.querySelectorAll('header nav a[href^="#"],header nav summary')].some((a) => a.checkVisibility({ checkVisibilityCSS: true }));
      if (t) t.setAttribute('data-qa-menu', '1');
      return { toggle: !!t, navVisible, panel: t ? t.getAttribute('aria-controls') : '' };
    });
    if (!r.toggle && !r.navVisible) return this.rep('Menú', 'navegación', 'fail', 'a este ancho no hay menú visible ni botón de menú: el usuario no puede navegar');
    if (!r.toggle) return this.rep('Menú', 'navegación', 'ok', 'menú de escritorio visible');
    const loc = this.page.locator('[data-qa-menu="1"]');
    const state = () => this.page.evaluate(() => { const b = document.querySelector('[data-qa-menu="1"]'); const p = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), vis: !!p && p.checkVisibility({ checkVisibilityCSS: true }) && p.getBoundingClientRect().height > 20 }; });
    await this.act(loc); await sleep(500); const open = await state();
    await this.act(loc); await sleep(500); const closed = await state();
    const ok = open.exp === 'true' && open.vis && closed.exp !== 'true' && !closed.vis;
    this.rep('Menú', 'botón hamburguesa (abrir y cerrar)', ok ? 'ok' : 'fail', ok ? 'abre y cierra el panel correctamente' : `abrir: aria=${open.exp} visible=${open.vis} | cerrar: aria=${closed.exp} visible=${closed.vis}`, ok ? '' : await this.shot('menú', '[data-qa-menu="1"]'));
    await this.reset();
  }

  // ───── formularios ─────
  async testForms() {
    const forms = await this.page.evaluate(FORMS);
    for (const f of forms) {
      const fsel = `[data-qf="${f.i}"]`; const name = `#${f.id}`;
      if (!f.hasBtn || !f.fields.length) continue;
      const prep = async () => { await this.reset(); await this.page.evaluate(FORMS); return this.reveal(fsel); };
      if (!(await prep())) { this.rep('Formulario', name, 'info', 'oculto a este ancho'); continue; }
      const submit = () => this.act(this.page.locator(`${fsel} [type=submit],${fsel} button:not([type=button])`).first());
      // A) vacío
      await this.page.locator(fsel).scrollIntoViewIfNeeded().catch(() => {});
      await this.page.evaluate(() => { window.__qa.mut = 0; }); this.popups.length = 0;
      try { await submit(); await sleep(500); } catch (e) { this.rep('Formulario', `${name} · botón enviar`, 'fail', 'no se puede tocar: ' + e.message.split('\n')[0].slice(0, 90), await this.shot(name, fsel)); continue; }
      const popA = await this.takePopups();
      const fb = await this.page.evaluate((s) => { const f = document.querySelector(s); return { invalid: !f.checkValidity(), mut: window.__qa.mut, ai: f.querySelectorAll('[aria-invalid=true]').length }; }, fsel);
      const needsInput = f.fields.some((x) => x.req || x.tag !== 'select');
      if (needsInput) this.rep('Formulario', `${name} · enviar vacío`, popA.length ? 'fail' : fb.invalid || fb.ai || fb.mut > 2 ? 'ok' : 'warn', popA.length ? 'abrió WhatsApp con el formulario vacío' : fb.invalid || fb.ai || fb.mut > 2 ? 'no envía y avisa qué falta' : 'no envía pero tampoco avisa qué falta');
      // B) válido (y todas las opciones del selector principal en algunos anchos)
      const main = f.fields.find((x) => x.tag === 'select' && x.opts.length >= 3);
      const variants = main && FULL_FORM_SWEEP.has(this.vp.w) ? main.opts.map((_, k) => k) : [0];
      for (const k of variants) {
        if (!(await prep())) break;
        const tokens = [];
        for (const fl of f.fields) {
          const s = `[data-qff="${f.i}-${fl.j}"]`; const loc = this.page.locator(s);
          if (!fl.vis && !(await this.reveal(s))) continue;
          try {
            if (fl.tag === 'select') await loc.selectOption({ index: fl.j === main?.j ? k : 0 });
            else if (fl.type === 'checkbox') await loc.check({ force: true });
            else if (fl.type === 'radio') await loc.check({ force: true });
            else {
              const k2 = norm(`${fl.id} ${fl.name} ${fl.ph}`);
              const numeric = fl.type === 'number' || fl.im === 'numeric' || fl.im === 'decimal';
              const v = fl.type === 'email' ? 'qa@example.com' : fl.type === 'tel' ? '3442123456' : /anio|year|\bano\b/.test(k2) ? '2021' : /km|kilomet/.test(k2) ? '50000' : fl.tag === 'textarea' ? 'Mensaje de prueba automatizado' : numeric ? (fl.ml === 4 ? '2021' : '50000') : 'QA Prueba';
              await loc.fill(v); tokens.push(v);
            }
          } catch { /* campo no interactuable */ }
        }
        await this.page.evaluate(() => { window.__qa.mut = 0; }); this.popups.length = 0;
        const tag = variants.length > 1 ? ` · opción ${k + 1}/${variants.length} (${main.opts[k]})` : '';
        try { await submit(); await sleep(600); } catch (e) { this.rep('Formulario', `${name}${tag} · enviar`, 'fail', 'no se puede tocar: ' + e.message.split('\n')[0].slice(0, 90)); continue; }
        const pops = await this.takePopups(); const off = !this.page.url().startsWith(this.origin);
        const u = pops[0] || (off ? this.page.url() : '');
        if (!u) { const m = await this.page.evaluate(() => window.__qa.mut); this.rep('Formulario', `${name}${tag} · enviar completo`, 'fail', m > 2 ? 'la página reaccionó pero no se abrió WhatsApp ni ningún destino' : 'SIN EFECTO al enviar el formulario completo', await this.shot(name, fsel)); continue; }
        if (/wa\.me|whatsapp\.com/.test(u)) {
          const w = this.checkWa(u); const missing = tokens.filter((t) => !norm(w.text).includes(norm(t)) && t !== '2021' && t !== '50000' && t !== '3442123456' && t !== 'qa@example.com');
          this.rep('Formulario', `${name}${tag} · enviar completo`, w.ok && !missing.length ? 'ok' : 'fail', w.ok ? (missing.length ? `el mensaje no incluye lo escrito: ${missing.join(', ')}` : `abre WhatsApp ${w.msg}`) : w.msg);
        } else this.rep('Formulario', `${name}${tag} · enviar completo`, 'ok', `abre ${u.slice(0, 90)}`);
      }
    }
  }

  // ───── responsive / layout ─────
  async testLayout() {
    const L = await this.page.evaluate(LAYOUT);
    if (L.hasScroll) this.rep('Layout', 'scroll horizontal', 'fail', `la página mide ${L.docW}px en una pantalla de ${L.vw}px. Se salen: ${L.culprits.map((c) => `${c.s} (borde derecho ${c.right}px${c.t ? ', “' + c.t + '”' : ''})`).join(' · ')}`, await this.shot('overflow', ''));
    else if (L.nCulprits) this.rep('Layout', 'contenido recortado', 'warn', `${L.nCulprits} elementos exceden el ancho y quedan cortados por overflow oculto: ${L.culprits.slice(0, 4).map((c) => `${c.s} (${c.right}px)`).join(' · ')}`);
    else this.rep('Layout', 'scroll horizontal', 'ok', `sin desborde a ${L.vw}px`);
    if (L.broken.length) this.rep('Layout', 'imágenes rotas', 'fail', L.broken.join(', ')); else this.rep('Layout', 'imágenes', 'ok', 'todas cargan');
    if (this.touch) {
      const small = this.inv.filter((e) => e.vis && !e.inline && (e.w < 24 || e.h < 24));
      this.rep('Layout', 'botones/links táctiles chicos', small.length ? 'warn' : 'ok', small.length ? `${small.length} elementos miden menos de 24px (mínimo WCAG 2.2): ${small.slice(0, 5).map((e) => `“${e.text || e.tag}” ${e.w}×${e.h}`).join(' · ')}` : 'todos alcanzan 24×24px');
    }
    if (L.nTiny) this.rep('Layout', 'texto muy chico', 'warn', `${L.nTiny} textos por debajo de 11px: ${L.tiny.join(' · ')}`);
  }
  async sectionShots() {
    const secs2 = await this.page.locator('header, main > section, main > div[id], footer').all();
    const dir = `galeria/${this.vp.w}`; mkdirSync(join(REPORT, dir), { recursive: true });
    let n = 0;
    for (const s of secs2.slice(0, 40)) {
      try { const id = (await s.getAttribute('id')) || (await s.evaluate((e) => e.tagName.toLowerCase())); const f = `${dir}/${this.pageName.replace(/\W+/g, '_')}-${String(++n).padStart(2, '0')}-${id.replace(/\W+/g, '')}.jpg`; await s.screenshot({ path: join(REPORT, f), type: 'jpeg', quality: 55, timeout: 8000 }); this.shared.gallery.push({ vp: this.vp.name, w: this.vp.w, page: this.pageName, id, file: f }); } catch { /* sección muy alta o invisible */ }
    }
  }
  async sweep() {
    const bad = [];
    for (const w of SWEEP) {
      await this.page.setViewportSize({ width: w, height: 900 }); await sleep(90);
      const r = await this.page.evaluate(() => { const vw = document.documentElement.clientWidth; return { over: document.documentElement.scrollWidth - vw }; });
      if (r.over > 1) bad.push(`${w}px (+${r.over}px)`);
    }
    this.rep('Layout', `barrido de ${SWEEP.length} anchos (320–2560px)`, bad.length ? 'fail' : 'ok', bad.length ? `scroll horizontal en: ${bad.join(', ')}` : 'sin scroll horizontal en ningún ancho');
    await this.page.setViewportSize({ width: this.vp.w, height: this.vp.h });
  }
  async testData() {
    const d = await this.page.evaluate(DATA); const P = this.pageName; const V = this.vp.name;
    const count = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
    for (const [t, n] of count(d.tel)) add(V, P, 'Datos', `teléfono ${t}`, !EXPECTED.tel.size || EXPECTED.tel.has(t) ? 'ok' : 'fail', `aparece ${n} veces${EXPECTED.tel.size && !EXPECTED.tel.has(t) ? ' — NO figura en el README' : ''}`);
    for (const [t, n] of count(d.wa.map((x) => parseWa(x).phone))) add(V, P, 'Datos', `WhatsApp ${t}`, !EXPECTED.wa.size || EXPECTED.wa.has(t) ? 'ok' : 'fail', `aparece ${n} veces${EXPECTED.wa.size && !EXPECTED.wa.has(t) ? ' — NO figura en el README' : ''}`);
    for (const [t, n] of count(d.mail)) add(V, P, 'Datos', `mail ${t}`, 'info', `aparece ${n} veces`);
    if (EXPECTED.addr) {
      const a = norm(EXPECTED.addr);
      add(V, P, 'Datos', `dirección “${EXPECTED.addr}” en el texto`, norm(d.text).includes(a) ? 'ok' : 'warn', norm(d.text).includes(a) ? 'figura en la página' : 'no figura en el texto visible de esta página');
      for (const m of new Set(d.maps)) { const q = norm(plain(m)); add(V, P, 'Datos', `mapa → ${plain(m).slice(0, 80)}`, q.includes(a) ? 'ok' : 'warn', q.includes(a) ? 'apunta a la dirección correcta' : 'el destino del mapa no menciona la dirección del README (revisar a mano)'); }
    }
    d.jsonld.forEach((j, k) => { try { const o = JSON.parse(j); add(V, P, 'Datos', `JSON-LD #${k + 1}`, 'ok', `válido (${[].concat(o['@type'] || o['@graph']?.map((x) => x['@type']) || []).join(', ')})`); } catch (e) { add(V, P, 'Datos', `JSON-LD #${k + 1}`, 'fail', 'JSON inválido: ' + e.message.slice(0, 80)); } });
    if (!d.title.trim()) add(V, P, 'Datos', '<title>', 'fail', 'la página no tiene título'); if (!d.lang) add(V, P, 'Datos', '<html lang>', 'warn', 'falta el atributo lang');
  }
}

// ─────────────────────────── ejecución por viewport ───────────────────────────
async function runViewport(browser, vp, pages, origin, shared, first) {
  const touch = vp.w <= 1024;
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: touch ? 2 : 1, isMobile: vp.w <= 820, hasTouch: touch, reducedMotion: 'reduce', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', serviceWorkers: 'block' });
  await ctx.addInitScript(INIT_SCRIPT);
  await ctx.route((u) => { try { return new URL(u).origin !== origin && /^https?:/.test(u.href || u); } catch { return false; } }, (route) => {
    const r = route.request(); const t = r.resourceType();
    if (t === 'document') return route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><title>externo</title><body>externo: ${r.url()}` });
    return route.fulfill({ status: 200, contentType: CT[t] || 'text/plain', body: t === 'image' ? GIF : '' });
  });
  for (const p of pages) {
    const url = origin + p.path; const A = new Auditor(ctx, vp, origin, p.name, url, shared);
    try {
      await A.init(); await A.load(true);
      await A.page.evaluate(() => { window.__qa.mut = 0; }); await sleep(600);
      A.noise = await A.page.evaluate(() => window.__qa.mut);
      {
        await A.testLayout();
        if (first) await A.testData();
        if (vp.w === 1440) await A.sweep();
        await A.sectionShots();
        if (!A.is404) await A.testMenu();
        await A.load(false);
        await A.testAll();
        await A.testForms();
      }
      console.log(`✔ ${vp.name} · ${p.name} (${secs()})`);
    } catch (e) {
      add(vp.name, p.name, 'Interno', 'auditoría interrumpida', 'fail', e.message.split('\n')[0].slice(0, 200));
      console.log(`✘ ${vp.name} · ${p.name}: ${e.message.split('\n')[0]}`);
    } finally { await A.page?.close().catch(() => {}); }
  }
  await ctx.close();
}

// ─────────────────────────── links externos (red real) ───────────────────────────
async function checkExternal(shared) {
  const urls = [...shared.external.keys()].filter((u) => /^https?:/.test(u));
  if (!urls.length) return;
  console.log(`▶ Verificando ${urls.length} links externos en internet…`);
  try { await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(6000) }); } catch { add('todos', 'red', 'Link externo', `${urls.length} links externos`, 'warn', 'sin conexión a internet: no se pudo verificar que existan (se revisó igual que abran donde corresponde)'); return; }
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
  let idx = 0;
  const worker = async () => {
    while (idx < urls.length) {
      const u = urls[idx++];
      try {
        const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*', 'accept-language': 'es-AR' }, signal: AbortSignal.timeout(12000) });
        r.body?.cancel().catch(() => {});
        const blocked = [401, 403, 429, 999].includes(r.status);
        const st = r.status < 400 ? 'ok' : blocked ? 'warn' : 'fail';
        add('todos', [...shared.external.get(u)].join(', '), 'Link externo', u.slice(0, 110), st, r.status < 400 ? `HTTP ${r.status}${r.redirected ? ' (redirige a ' + r.url.slice(0, 70) + ')' : ''}` : blocked ? `HTTP ${r.status}: el sitio bloquea bots, probalo a mano` : `HTTP ${r.status}: el link está roto`);
      } catch (e) { add('todos', [...shared.external.get(u)].join(', '), 'Link externo', u.slice(0, 110), 'fail', 'no responde: ' + (e.cause?.code || e.name)); }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

// ─────────────────────────── descubrir páginas ───────────────────────────
function discoverPages() {
  if (REMOTE) return [{ name: 'index (remoto)', path: '/' }];
  const files = readdirSync(ROOT).filter((f) => /^[^.].*\.html$/.test(f) && f !== '404.html' && f !== 'index.html');
  return [{ name: 'index.html', path: '/' }, ...files.sort().map((f) => ({ name: f, path: '/' + f })), { name: '404.html', path: '/__no-existe__' }];
}
function ensureModelPages() {
  const g = join(ROOT, 'scripts', 'generate-model-pages.mjs'); const d = join(ROOT, 'data', 'models.json');
  if (!existsSync(g) || !existsSync(d)) return;
  try { const slugs = JSON.parse(readFileSync(d, 'utf8')).map((m) => m.slug); if (slugs.some((s) => !existsSync(join(ROOT, `${s}.html`)))) { console.log('▶ Generando fichas de modelos que faltan…'); sh(process.execPath, [g]); } } catch { /* sigue */ }
}
function gitignore() {
  const f = join(ROOT, '.gitignore'); if (!existsSync(f)) return;
  const t = readFileSync(f, 'utf8'); const add2 = ['.qa/', 'qa-report/'].filter((x) => !t.split(/\r?\n/).includes(x));
  if (add2.length) appendFileSync(f, `${t.endsWith('\n') ? '' : '\n'}# Auditoría automática (qa.mjs)\n${add2.join('\n')}\n`);
}

// ─────────────────────────── reporte ───────────────────────────
function writeReport(shared, vps) {
  const order = { fail: 0, warn: 1, ok: 2, info: 3 };
  const count = (f) => results.filter(f).length;
  const totals = { fail: count((r) => r.status === 'fail'), warn: count((r) => r.status === 'warn'), ok: count((r) => r.status === 'ok'), info: count((r) => r.status === 'info') };
  // agrupa filas idénticas de distintos anchos
  const groups = new Map();
  for (const r of results) {
    const k = [r.page, r.type, r.name, r.status].join('|');
    const g = groups.get(k) || { page: r.page, type: r.type, name: r.name, status: r.status, detail: r.detail, vps: [], shot: r.shot, details: new Set() };
    g.vps.push(r.vp); if (!g.shot && r.shot) g.shot = r.shot; g.details.add(r.detail); groups.set(k, g);
  }
  const rows = [...groups.values()].map((g) => ({ ...g, details: [...g.details].slice(0, 3), n: g.vps.length })).sort((a, b) => order[a.status] - order[b.status] || a.type.localeCompare(b.type));
  const perVp = vps.map((v) => ({ vp: v.name, fail: count((r) => r.vp === v.name && r.status === 'fail'), warn: count((r) => r.vp === v.name && r.status === 'warn'), ok: count((r) => r.vp === v.name && r.status === 'ok') }));
  writeFileSync(join(REPORT, 'resultados.json'), JSON.stringify({ generado: new Date().toISOString(), totals, results }, null, 1));
  const md = [`# Reporte QA — ${new Date().toLocaleString('es-AR')}`, '', `FALLAS: ${totals.fail} · AVISOS: ${totals.warn} · OK: ${totals.ok}`, '', ...rows.filter((r) => r.status === 'fail' || r.status === 'warn').map((r) => `- **${r.status === 'fail' ? 'FALLA' : 'AVISO'}** [${r.type}] ${r.page} — ${r.name} — ${r.details[0]} _(anchos: ${[...new Set(r.vps)].join(', ')})_`)].join('\n');
  writeFileSync(join(REPORT, 'resultados.md'), md);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gal = {}; for (const g of shared.gallery) (gal[g.vp] ||= []).push(g);
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reporte QA</title>
<style>:root{--bg:#0f1115;--card:#171a21;--tx:#e8eaf0;--mut:#8b93a7;--ok:#2ecc71;--fail:#ff4d6d;--warn:#ffb020;--info:#5aa9ff;--bd:#262b36}@media(prefers-color-scheme:light){:root{--bg:#f5f6f8;--card:#fff;--tx:#14171f;--mut:#5b6478;--bd:#dfe3ea}}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--tx)}main{max-width:1200px;margin:auto;padding:20px}h1{margin:0 0 4px}h2{margin:28px 0 10px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.tile{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px}.tile b{font-size:28px;display:block}
.fail{color:var(--fail)}.warn{color:var(--warn)}.ok{color:var(--ok)}.info{color:var(--info)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--bd);border-radius:12px;overflow:hidden}th,td{padding:8px 10px;border-bottom:1px solid var(--bd);text-align:left;vertical-align:top}th{color:var(--mut);font-weight:600;font-size:12px}
.pill{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;border:1px solid currentColor}.vps{color:var(--mut);font-size:12px}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}select,input{background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:8px}
.scroll{overflow-x:auto}a{color:var(--info)}details{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:8px 12px;margin:8px 0}summary{cursor:pointer;font-weight:600}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:10px}.gal img{width:100%;border-radius:6px;border:1px solid var(--bd)}.gal small{color:var(--mut)}
td.d{max-width:520px;word-break:break-word}</style>
<main><h1>Reporte de QA automático</h1><div class="vps">${new Date().toLocaleString('es-AR')} · ${vps.length} tamaños de pantalla · ${esc(REMOTE || 'sitio local')} · duró ${secs()}</div>
<h2>Resumen</h2><div class="tiles"><div class="tile"><b class="fail">${totals.fail}</b>fallas</div><div class="tile"><b class="warn">${totals.warn}</b>avisos</div><div class="tile"><b class="ok">${totals.ok}</b>ok</div><div class="tile"><b>${results.length}</b>chequeos</div></div>
<h2>Por tamaño de pantalla</h2><div class="scroll"><table><tr><th>Pantalla</th><th>Fallas</th><th>Avisos</th><th>OK</th></tr>${perVp.map((p) => `<tr><td>${esc(p.vp)}</td><td class="${p.fail ? 'fail' : ''}">${p.fail}</td><td class="${p.warn ? 'warn' : ''}">${p.warn}</td><td class="ok">${p.ok}</td></tr>`).join('')}</table></div>
<h2>Detalle</h2><div class="bar"><select id="fs"><option value="">Todos los estados</option><option value="fail" selected>Fallas</option><option value="warn">Avisos</option><option value="ok">OK</option><option value="info">Info</option></select><select id="ft"><option value="">Todos los tipos</option>${[...new Set(rows.map((r) => r.type))].sort().map((t) => `<option>${esc(t)}</option>`).join('')}</select><select id="fp"><option value="">Todas las páginas</option>${[...new Set(rows.map((r) => r.page))].map((t) => `<option>${esc(t)}</option>`).join('')}</select><input id="q" placeholder="Buscar…" size="26"></div>
<div class="scroll"><table id="t"><thead><tr><th>Estado</th><th>Tipo</th><th>Página</th><th>Elemento</th><th>Resultado</th><th>Pantallas</th></tr></thead><tbody>${rows.map((r) => `<tr data-s="${r.status}" data-t="${esc(r.type)}" data-p="${esc(r.page)}"><td><span class="pill ${r.status}">${{ fail: 'FALLA', warn: 'AVISO', ok: 'OK', info: 'INFO' }[r.status]}</span></td><td>${esc(r.type)}</td><td>${esc(r.page)}</td><td class="d">${esc(r.name)}</td><td class="d">${esc(r.details.join(' | '))}${r.shot ? ` <a href="${r.shot}" target="_blank">📷 captura</a>` : ''}</td><td class="vps">${r.n === vps.length ? 'todas' : esc([...new Set(r.vps)].map((v) => v.split(' ')[0]).join(', '))}</td></tr>`).join('')}</tbody></table></div>
<h2>Capturas por tamaño de pantalla</h2>${vps.map((v) => `<details><summary>${esc(v.name)} (${(gal[v.name] || []).length} secciones)</summary><div class="gal">${(gal[v.name] || []).map((g) => `<a href="${g.file}" target="_blank"><img loading="lazy" src="${g.file}" alt=""><small>${esc(g.page)} · ${esc(g.id)}</small></a>`).join('')}</div></details>`).join('')}
</main><script>const $=id=>document.getElementById(id),rs=[...document.querySelectorAll('#t tbody tr')];function f(){const s=$('fs').value,t=$('ft').value,p=$('fp').value,q=$('q').value.toLowerCase();rs.forEach(r=>{r.hidden=(s&&r.dataset.s!==s)||(t&&r.dataset.t!==t)||(p&&r.dataset.p!==p)||(q&&!r.textContent.toLowerCase().includes(q))})}['fs','ft','fp'].forEach(i=>$(i).onchange=f);$('q').oninput=f;f()</script></html>`;
  writeFileSync(join(REPORT, 'index.html'), html);
  return { totals, rows };
}
function openFile(p) {
  try {
    if (process.platform === 'win32') spawnSync('cmd', ['/c', 'start', '', p], { stdio: 'ignore' });
    else spawnSync(process.platform === 'darwin' ? 'open' : 'xdg-open', [p], { stdio: 'ignore' });
  } catch { /* nada */ }
}

// ─────────────────────────── main ───────────────────────────
(async () => {
  console.log(`\n══ QA automático${REMOTE ? ' de ' + REMOTE : ''} — ${VIEWPORTS.length} tamaños de pantalla ══\n`);
  if (!REMOTE) { ensureModelPages(); gitignore(); }
  const pw = await loadPlaywright();
  rmSync(REPORT, { recursive: true, force: true }); mkdirSync(join(REPORT, 'fallas'), { recursive: true }); mkdirSync(join(REPORT, 'galeria'), { recursive: true });
  let srv = null; let origin;
  if (REMOTE) origin = new URL(REMOTE).origin; else { srv = await startServer(); origin = srv.origin; }
  const pages = discoverPages();
  if (REMOTE) pages[0].path = new URL(REMOTE).pathname || '/';
  console.log(`▶ Páginas: ${pages.map((p) => p.name).join(', ')}\n▶ Pantallas: ${VIEWPORTS.map((v) => v.w).join(', ')}px\n`);
  const browser = await launchBrowser(pw);
  const shared = { external: new Map(), gallery: [] };
  const conc = Number(process.env.QA_CONC) || Math.max(2, Math.min(5, os.cpus().length - 1)); let next = 0;
  const worker = async () => { while (next < VIEWPORTS.length) { const k = next++; try { await runViewport(browser, VIEWPORTS[k], pages, origin, shared, k === 0); } catch (e) { add(VIEWPORTS[k].name, '-', 'Interno', 'viewport interrumpido', 'fail', e.message.split('\n')[0]); } } };
  await Promise.all(Array.from({ length: conc }, worker));
  await browser.close(); srv?.server.close();
  await checkExternal(shared);
  const { totals, rows } = writeReport(shared, VIEWPORTS);
  const bad = rows.filter((r) => r.status === 'fail');
  console.log(`\n══ RESULTADO (${secs()}) ══\n   ✘ ${totals.fail} fallas   ⚠ ${totals.warn} avisos   ✔ ${totals.ok} ok   (${results.length} chequeos)\n`);
  bad.slice(0, 30).forEach((r) => console.log(`   ✘ [${r.type}] ${r.page} · ${r.name.slice(0, 70)}\n       ${r.details[0].slice(0, 160)}   (${r.n === VIEWPORTS.length ? 'todas las pantallas' : [...new Set(r.vps)].map((v) => v.split(' ')[0]).join(', ')})`));
  if (bad.length > 30) console.log(`   … y ${bad.length - 30} más en el reporte`);
  const rp = join(REPORT, 'index.html'); console.log(`\n📄 Reporte: ${rp}`);
  if (!flag('no-open')) openFile(rp);
  process.exit(totals.fail ? 1 : 0);
})().catch((e) => { console.error('\n✘ Error inesperado:', e); process.exit(2); });
