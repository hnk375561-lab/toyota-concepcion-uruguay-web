// @ts-check
/** Hero quieto: sin parallax, sin scrub, sin deriva. Delta 0 en coordenadas de documento. */
import { test, expect } from '../support/fixtures.js';
import { openSite, docRect } from '../support/helpers.js';

const PARTES = {
  'figura principal': '.hero-editorial-vehicle:not(.hero-editorial-secondary)',
  'imagen principal': '.hero-editorial-vehicle:not(.hero-editorial-secondary) img',
  'figura secundaria': '.hero-editorial-secondary',
  'wordmark': '.hero-editorial-wordmark',
  'título': '.hero-editorial-copy h1',
};
const EPS = 0.05;

async function snapshot(page) {
  const out = {};
  for (const [name, sel] of Object.entries(PARTES)) out[name] = await docRect(page, sel);
  return out;
}

function expectSame(a, b, label) {
  for (const name of Object.keys(PARTES)) {
    for (const k of ['x', 'y', 'w', 'h']) {
      expect(Math.abs(a[name][k] - b[name][k]), `${label}: "${name}" ${k} (Δ=${b[name][k] - a[name][k]})`).toBeLessThanOrEqual(EPS);
    }
  }
}

for (const reduced of [false, true]) {
  test.describe(reduced ? 'con prefers-reduced-motion' : 'con motion normal', () => {
    test.use({ reducedMotion: reduced ? 'reduce' : 'no-preference' });

    test('delta 0 tras la intro, con la página en reposo', async ({ page, mobile }) => {
      await openSite(page, '', { mobile });
      await page.waitForTimeout(4000); // termina la coreografía de entrada
      const a = await snapshot(page);
      await page.waitForTimeout(1500);
      expectSame(a, await snapshot(page), 'reposo');
    });

    test('delta 0 al hacer scroll (sin parallax ni scrub)', async ({ page, mobile }) => {
      await openSite(page, '', { mobile });
      await page.waitForTimeout(4000);
      const base = await snapshot(page);
      for (const y of [120, 300, 480, 200, 0]) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(450);
        expectSame(base, await snapshot(page), `scrollY=${y}`);
      }
    });

    test('la imagen del hero no tiene transformaciones', async ({ page, mobile }) => {
      await openSite(page, '', { mobile });
      await page.waitForTimeout(3000);
      for (const y of [0, 250]) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(300);
        const t = await page.locator(PARTES['imagen principal']).evaluate((el) => getComputedStyle(el).transform);
        expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], `transform con scrollY=${y}`).toContain(t);
      }
    });
  });
}

test('el mouse sobre el hero no lo mueve (escritorio)', async ({ page, mobile }) => {
  test.skip(mobile, 'solo escritorio');
  await openSite(page);
  await page.waitForTimeout(4000);
  const base = await snapshot(page);
  const box = await page.locator('.hero-editorial-stage').boundingBox();
  for (const [fx, fy] of [[0.2, 0.3], [0.5, 0.5], [0.8, 0.7], [0.4, 0.2]]) {
    await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 6 });
    await page.waitForTimeout(250);
  }
  expectSame(base, await snapshot(page), 'mouse');
});
