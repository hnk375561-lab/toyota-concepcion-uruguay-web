// @ts-check
/** axe-core WCAG A/AA (2.0, 2.1 y 2.2): 0 violaciones, en la página, en cada tab y en estados interactivos. */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/fixtures.js';
import { openSite } from '../support/helpers.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const TABS = {
  comprar: ['financiacion', 'canje', 'usados', 'novedades', 'como-comprar'],
  postventa: ['servicios', 'repuestos', 'neumaticos', 'accesorios', 'taller'],
  nosotros: ['porque', 'instalaciones', 'galeria-google-maps', 'testimonios'],
};

const detalle = (n) => {
  const d = n.any?.[0]?.data;
  return d && d.contrastRatio ? ` (${d.fgColor} sobre ${d.bgColor}, ratio ${d.contrastRatio}, mínimo ${d.expectedContrastRatio})` : '';
};
const fmt = (v) => `${v.id} [${v.impact}] x${v.nodes.length}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ') + detalle(n)).join(' | ')}`;

async function scan(page, include, settleMs = 0) {
  // Sin animaciones CSS en curso (un fade a mitad de camino da contrastes falsos).
  await page.waitForFunction(
    () => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).every((a) => a.playState !== 'running'),
    undefined, { timeout: 5000 },
  ).catch(() => {});
  // Tweens de GSAP (no aparecen en getAnimations): p. ej. la tabla del comparador entra con stagger de ~1,1 s.
  if (settleMs) await page.waitForTimeout(settleMs);
  let b = new AxeBuilder({ page }).withTags(TAGS);
  if (include) b = b.include(include);
  const r = await b.analyze();
  expect(r.violations.map(fmt), 'violaciones axe A/AA').toEqual([]);
  return r;
}

async function recorrer(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= alto; y += 450) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
}

for (const reduced of [false, true]) {
  test(`página completa (${reduced ? 'reduced-motion' : 'motion normal'})`, async ({ page, isMobile }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await openSite(page, '', { mobile: isMobile });
    await recorrer(page);
    const r = await scan(page);
    // "Necesita revisión manual": no falla, queda registrado en el reporte.
    if (r.incomplete.length) {
      test.info().annotations.push({ type: 'axe-incomplete', description: r.incomplete.map((v) => `${v.id} x${v.nodes.length}`).join(', ') });
    }
  });
}

test.describe('cada tab de cada bloque', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const [bloque, keys] of Object.entries(TABS)) {
    test(`bloque ${bloque}`, async ({ page, isMobile }) => {
      test.slow();
      await openSite(page, '', { mobile: isMobile });
      for (const key of keys) {
        await page.evaluate((k) => document.getElementById('tab-' + k).click(), key);
        await expect(page.locator(`#panel-${key}`)).toBeVisible();
        await scan(page, `#panel-${key}`);
      }
    });
  }
});

test.describe('estados interactivos', () => {
  test.use({ reducedMotion: 'reduce' });

  test('mega menús abiertos (escritorio)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'solo escritorio');
    await openSite(page);
    const n = await page.locator('details.navmega').count();
    for (let i = 0; i < n; i++) {
      await page.locator('details.navmega summary').nth(i).click();
      await expect(page.locator('details.navmega').nth(i)).toHaveAttribute('open', '');
      await scan(page, '#site-header');
    }
  });

  test('drawer móvil abierto', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    await openSite(page, '', { mobile: true });
    await page.locator('#burger').click();
    await expect(page.locator('#mobilepanel')).toHaveClass(/open/);
    await scan(page, '#site-header');
  });

  test('comparador con resultado', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('#compareDisclosureButton').click();
    await page.locator('#compareA').selectOption('Hilux');
    await page.locator('#compareB').selectOption('RAV4');
    await expect(page.locator('#compareResult')).toBeVisible();
    await scan(page, '#comparar', 1600);
  });

  test('comparador con el mismo modelo', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('#compareDisclosureButton').click();
    await page.locator('#compareA').selectOption('Hilux');
    await page.locator('#compareB').selectOption('Hilux');
    await scan(page, '#comparar');
  });

  test('formulario de contacto con errores', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#cName')).toHaveAttribute('aria-invalid', 'true');
    await scan(page, '#contactForm');
  });

  test('catálogo filtrado', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('#filterbar .filterbtn[data-filter="suv"]').click();
    await scan(page, '#gama');
  });
});

test.describe('404.html', () => {
  test.use({ monitor: false });
  test('sin violaciones', async ({ page }) => {
    await page.goto('/404.html');
    await scan(page);
  });
});
