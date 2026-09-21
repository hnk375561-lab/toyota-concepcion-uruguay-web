// @ts-check
/**
 * Helpers de página. Sin selectores mágicos repartidos por los specs: todo lo que dependa
 * de la estructura del sitio vive acá.
 */
import { expect } from '@playwright/test';

/** true si el proyecto activo es el móvil (viewport 390, touch). */
export const isMobileProject = (testInfo) => testInfo.project.name === 'mobile';

/**
 * Navega y espera a que el sitio esté realmente listo: DOM completo, health-check propio de la
 * página sin ids faltantes, tabs/gsap inicializados, catálogo renderizado y —en escritorio— Lenis.
 * @param {import('@playwright/test').Page} page
 * @param {string} [hash]  ej. '#financiacion' (se concatena a '/')
 * @param {{ mobile?: boolean, waitLenis?: boolean }} [opts]
 */
export async function openSite(page, hash = '', opts = {}) {
  await page.goto('/' + hash, { waitUntil: 'load' });
  await waitReady(page, opts);
}

/** @param {import('@playwright/test').Page} page */
export async function waitReady(page, { mobile = false, waitLenis = true } = {}) {
  await page.waitForFunction(() => {
    const health = window.__toyotaHealth && window.__toyotaHealth.check();
    return !!health && health.ready && health.missingCount === 0 &&
      !!window.__toyotaTabs && !!window.gsap && !!window.ScrollTrigger &&
      document.querySelectorAll('#gama-grid .model').length > 0;
  }, undefined, { timeout: 20_000 });
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!mobile && !reduced && waitLenis) {
    // Lenis se carga en idle después de `load`; hasta entonces el scroll es nativo.
    await page.waitForFunction(() => !!window.__toyotaLenis, undefined, { timeout: 20_000 });
  }
}

/**
 * Estado de "aterrizaje" de un ancla: dónde quedó el destino respecto del header,
 * si es visible y —si vive en un tab— si su tab/panel están activos.
 * @param {import('@playwright/test').Page} page
 * @param {string} id  id del destino (sin '#')
 */
export function landing(page, id) {
  return page.evaluate((targetId) => {
    const el = document.getElementById(targetId);
    const header = document.getElementById('site-header');
    if (!el || !header) return { exists: !!el, ok: false, reason: 'sin destino o sin header' };
    const headerBottom = header.getBoundingClientRect().bottom;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const rendered = cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0;
    const inViewport = r.top < window.innerHeight && r.bottom > headerBottom;
    // El destino no puede quedar tapado por el header fijo.
    const clearOfHeader = r.top >= headerBottom - 3;
    // Con el scroll al final del documento el destino puede no llegar arriba de todo.
    const nearTop = r.top <= headerBottom + 40 || atBottom;
    const panel = el.closest('[role="tabpanel"]');
    let panelOk = true;
    let tabSelected = null;
    if (panel) {
      panelOk = !panel.hidden && getComputedStyle(panel).display !== 'none';
      const tab = document.querySelector(`[role="tab"][aria-controls="${panel.id}"]`) || document.getElementById('tab-' + panel.id.replace(/^panel-/, ''));
      tabSelected = tab ? tab.getAttribute('aria-selected') === 'true' : null;
    }
    return {
      exists: true,
      top: Math.round(r.top * 10) / 10,
      headerBottom: Math.round(headerBottom * 10) / 10,
      scrollY: Math.round(window.scrollY),
      atBottom, rendered, inViewport, clearOfHeader, nearTop, panelOk, tabSelected,
      ok: rendered && inViewport && clearOfHeader && nearTop && panelOk && tabSelected !== false,
    };
  }, id);
}

/**
 * Espera a que el ancla `id` quede bien posicionada Y quieta: el scroll suave de Lenis y la
 * activación de tabs siguen moviendo la página unos frames después del clic, así que se exige
 * que el estado sea correcto y no cambie durante ~500 ms seguidos.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 * @param {{ timeout?: number }} [opts]
 */
export async function expectLanded(page, id, { timeout = 12_000 } = {}) {
  const started = Date.now();
  let prev = null;
  let stable = 0;
  let last = await landing(page, id);
  while (Date.now() - started < timeout) {
    last = await landing(page, id);
    const still = prev && Math.abs(last.scrollY - prev.scrollY) < 1 && Math.abs(last.top - prev.top) < 1;
    stable = last.ok && still ? stable + 1 : 0;
    if (stable >= 4) return last;
    prev = last;
    await page.waitForTimeout(125);
  }
  expect(last.ok && stable >= 4, `#${id} debe quedar visible, sin tapar por el header, con su tab activo y sin moverse. Último estado: ${JSON.stringify(last)}`).toBe(true);
  return last;
}

/** Datos de un rect en coordenadas de documento (independiente del scroll). */
export function docRect(page, selector) {
  return page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    // Sin caja de layout (display:none, p. ej. la figura secundaria en móvil): posición neutra.
    if (r.width === 0 && r.height === 0) return { x: 0, y: 0, w: 0, h: 0, transform: 'none' };
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height, transform: getComputedStyle(el).transform };
  });
}

/** WhatsApp: separa número y texto decodificado de una URL wa.me. */
export function parseWa(url) {
  const u = new URL(url);
  return { origin: u.origin, phone: u.pathname.replace(/^\//, ''), text: u.searchParams.get('text') || '' };
}

/** Los tres canales publicados: cualquier otro número es un error de datos. */
export const CANALES = {
  ventas: '5493442473453',
  repuestos: '5493442677433',
  neumaticos: '5493442502390',
};

/** Único origen externo tolerado (embed de Google Maps). */
export const MAPS_EMBED_RE = /^https:\/\/www\.google\.com\/maps\?/;
