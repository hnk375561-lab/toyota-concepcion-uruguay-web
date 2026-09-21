// @ts-check
/**
 * Fixtures compartidos.
 *
 * `test` es el de Playwright + una vigilancia automática ("monitor") que hace fallar
 * CUALQUIER test si durante su ejecución la página produjo:
 *   - console.error o console.warning,
 *   - excepciones no capturadas (pageerror),
 *   - requests a otro origen (salvo el iframe de Google Maps, que se sirve como stub),
 *   - respuestas HTTP 4xx/5xx o requests fallidos.
 *
 * Los tests que provocan un error a propósito (p. ej. la página 404) lo desactivan con
 *   test.use({ monitor: false })
 */
import { test as base, expect } from '@playwright/test';

/** Único origen externo permitido: el embed de Google Maps (lazy, bajo el fold). */
export const MAPS_EMBED = /^https:\/\/www\.google\.com\/maps\?/;

const STUB_MAP_HTML =
  '<!doctype html><html lang="es"><meta charset="utf-8"><title>Mapa (stub de test)</title><body style="margin:0;background:#dde">Mapa</body></html>';

export const test = base.extend({
  /** Activa/desactiva la vigilancia (por defecto activa). */
  monitor: [true, { option: true }],

  /** Registro de lo que ocurrió en la página. Disponible para asserts propios. */
  telemetry: [
    async ({ page, context, baseURL }, use) => {
      const origin = new URL(baseURL).origin;
      const t = {
        console: /** @type {string[]} */ ([]),
        pageErrors: /** @type {string[]} */ ([]),
        external: /** @type {string[]} */ ([]),
        mapsEmbed: /** @type {string[]} */ ([]),
        badStatus: /** @type {string[]} */ ([]),
        failed: /** @type {string[]} */ ([]),
        requests: /** @type {string[]} */ ([]),
        /** Todo lo que sea problema, en una sola lista legible. */
        problems() {
          return [
            ...this.console.map((m) => `console: ${m}`),
            ...this.pageErrors.map((m) => `pageerror: ${m}`),
            ...this.external.map((u) => `request externo: ${u}`),
            ...this.badStatus.map((m) => `HTTP: ${m}`),
            ...this.failed.map((m) => `request fallido: ${m}`),
          ];
        },
      };

      // El embed de Google Maps se responde localmente: el test no depende de internet.
      await context.route(MAPS_EMBED, (route) =>
        route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: STUB_MAP_HTML }),
      );

      // WhatsApp: los popups de wa.me se responden localmente (no se sale a internet).
      await context.route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (route) =>
        route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>WhatsApp (stub)</title>' }),
      );

      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          const loc = msg.location();
          t.console.push(`${msg.type()}: ${msg.text()}${loc && loc.url ? ` (${loc.url}:${loc.lineNumber})` : ''}`);
        }
      });
      page.on('pageerror', (err) => t.pageErrors.push(String(err && err.stack ? err.stack.split('\n')[0] : err)));
      page.on('request', (req) => {
        const url = req.url();
        if (!/^https?:/i.test(url)) return; // data:, blob:, about:
        t.requests.push(url);
        if (new URL(url).origin === origin) return;
        if (MAPS_EMBED.test(url)) t.mapsEmbed.push(url);
        else t.external.push(`${req.method()} ${url}`);
      });
      page.on('response', (res) => {
        if (res.status() >= 400) t.badStatus.push(`${res.status()} ${res.url()}`);
      });
      page.on('requestfailed', (req) => {
        const why = req.failure()?.errorText || 'desconocido';
        if (/ERR_ABORTED/.test(why)) return; // cancelaciones por navegación: no son fallas
        t.failed.push(`${req.method()} ${req.url()} → ${why}`);
      });

      await use(t);
    },
    { scope: 'test' },
  ],

  // Auto-fixture: al terminar cada test verifica la telemetría.
  guard: [
    async ({ telemetry, monitor }, use) => {
      await use(undefined);
      if (monitor) expect.soft(telemetry.problems(), 'La página no debe emitir errores, warnings, requests externos ni 4xx/5xx').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
