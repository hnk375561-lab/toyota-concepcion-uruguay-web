// @ts-check
/** Salud general: 0 console.error/warning, 0 requests externos, 0 4xx/5xx, sin overflow, catálogo y 404. */
import { test, expect } from '../support/fixtures.js';
import { openSite, MAPS_EMBED_RE } from '../support/helpers.js';

async function recorrerPagina(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const paso = Math.floor((await page.evaluate(() => window.innerHeight)) * 0.8);
  for (let y = 0; y <= alto; y += paso) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(800);
}

test.describe('Carga y recorrido completo', () => {
  test('la carga inicial no hace NINGÚN request a otro origen', async ({ page, telemetry, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.waitForTimeout(1500);
    expect(telemetry.external).toEqual([]);
    expect(telemetry.mapsEmbed, 'el mapa es lazy: no debe pedirse antes de scrollear').toEqual([]);
    expect(telemetry.problems()).toEqual([]);
  });

  test('recorrer toda la página: 0 errores, 0 warnings, solo el embed de Maps como externo', async ({ page, telemetry, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await recorrerPagina(page);
    expect(telemetry.console).toEqual([]);
    expect(telemetry.pageErrors).toEqual([]);
    expect(telemetry.external).toEqual([]);
    expect(telemetry.badStatus).toEqual([]);
    expect(telemetry.failed).toEqual([]);
    for (const url of telemetry.mapsEmbed) expect(url).toMatch(MAPS_EMBED_RE);
  });

  test('no hay imágenes rotas tras recorrer la página', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await recorrerPagina(page);
    const rotas = await page.evaluate(() =>
      [...document.images].filter((i) => i.currentSrc && i.complete && i.naturalWidth === 0).map((i) => i.currentSrc));
    expect(rotas).toEqual([]);
  });

  test('sin scroll horizontal', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    const m = await page.evaluate(() => ({ body: document.body.scrollWidth, html: document.documentElement.scrollWidth, vw: window.innerWidth }));
    expect(m.body).toBeLessThanOrEqual(m.vw);
    expect(m.html).toBeLessThanOrEqual(m.vw);
  });

  test('el health-check propio de la página no reporta ids faltantes', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    expect(await page.evaluate(() => window.__toyotaHealth.check())).toMatchObject({ ready: true, missing: [], missingCount: 0 });
  });
});

test.describe('Catálogo', () => {
  const ESPERADOS = { todos: 9, pickup: 1, suv: 5, sedan: 3 };
  for (const [filtro, n] of Object.entries(ESPERADOS)) {
    test(`filtro "${filtro}" muestra ${n} modelos`, async ({ page, isMobile }) => {
      await openSite(page, '', { mobile: isMobile });
      await page.locator(`#filterbar .filterbtn[data-filter="${filtro}"]`).click();
      await expect(page.locator('#gama-grid .model:not([hidden])')).toHaveCount(n);
      await expect(page.locator('#filterEmpty')).toBeHidden();
    });
  }
});

test.describe('Página 404', () => {
  test.use({ monitor: false });
  test('responde 404 real, con mensaje y link de vuelta', async ({ page }) => {
    const res = await page.goto('/esta-pagina-no-existe');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página no está disponible.');
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();
  });
});
