// @ts-check
/** Clic real en TODOS los links del menú: 12 en escritorio (mega menús + directos) y 19 en móvil (drawer). */
import { test, expect } from '../support/fixtures.js';
import { openSite, expectLanded } from '../support/helpers.js';

/** [grupo del mega menú | null, texto visible, id destino] */
const DESKTOP = [
  ['Vehículos', '0 km', 'gama'],
  ['Vehículos', 'Usados', 'usados'],
  ['Vehículos', 'Comparar modelos', 'comparar'],
  ['Compra', 'Financiación', 'financiacion'],
  ['Compra', 'Plan canje', 'canje'],
  ['Compra', 'Consultar', 'contacto'],
  ['Postventa', 'Service oficial', 'servicios'],
  ['Postventa', 'Repuestos y accesorios', 'repuestos'],
  ['Postventa', 'Neumáticos', 'neumaticos'],
  ['Postventa', 'Nuestro taller', 'taller'],
  [null, 'Por qué elegirnos', 'porque'],
  [null, 'Concesionario', 'concesionario'],
];

/** [texto, id destino] en el orden del drawer móvil */
const MOBILE = [
  ['Modelos Toyota', 'gama'],
  ['Gama completa', 'gama'],
  ['Explorar por categoría', 'gama'],
  ['Por qué elegirnos', 'porque'],
  ['Cómo comprar', 'como-comprar'],
  ['Usados', 'usados'],
  ['Comparar modelos', 'comparar'],
  ['Plan canje', 'canje'],
  ['Financiación', 'financiacion'],
  ['Accesorios y merchandising', 'accesorios'],
  ['Service', 'servicios'],
  ['Mantenimiento', 'mantenimiento'],
  ['Neumáticos', 'neumaticos'],
  ['Taller', 'taller'],
  ['Repuestos', 'repuestos'],
  ['Conocé el concesionario', 'instalaciones'],
  ['Testimonios', 'testimonios'],
  ['Preguntas frecuentes', 'faq'],
  ['Ubicación', 'ubicacion'],
];

async function checkComparar(page, id) {
  if (id !== 'comparar') return;
  await expect(page.locator('#compareDisclosureButton')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#comparar')).toBeVisible();
}

test.describe('Menú de escritorio (12 links)', () => {
  test.skip(({ mobile }) => mobile, 'solo escritorio');

  test('el menú tiene exactamente 12 links', async ({ page }) => {
    await openSite(page);
    await expect(page.locator('nav.navlinks a')).toHaveCount(DESKTOP.length);
  });

  for (const [group, text, id] of DESKTOP) {
    test(`${group ?? 'directo'} › ${text} → #${id}`, async ({ page }) => {
      await openSite(page);
      const link = page.locator(`nav.navlinks a[href="#${id}"]`).filter({ hasText: text });
      if (group) {
        const details = page.locator('details.navmega').filter({ has: page.locator('summary', { hasText: group }) });
        await details.locator('summary').click();
        await expect(details).toHaveAttribute('open', '');
      }
      await link.click();
      await expectLanded(page, id);
      await checkComparar(page, id);
      expect(new URL(page.url()).hash).toBe(`#${id}`);
    });
  }
});

test.describe('Menú móvil (19 links)', () => {
  test.skip(({ mobile }) => !mobile, 'solo móvil');

  test('el drawer tiene exactamente 19 links internos', async ({ page }) => {
    await openSite(page, '', { mobile: true });
    await expect(page.locator('#mobilepanel a[href^="#"]')).toHaveCount(MOBILE.length);
  });

  test('el burger abre y cierra el drawer', async ({ page }) => {
    await openSite(page, '', { mobile: true });
    const burger = page.locator('#burger');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobilepanel')).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });

  MOBILE.forEach(([text, id], i) => {
    test(`${String(i + 1).padStart(2, '0')} ${text} → #${id}`, async ({ page }) => {
      await openSite(page, '', { mobile: true });
      await page.locator('#burger').click();
      await expect(page.locator('#burger')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('#mobilepanel').getByRole('link', { name: text, exact: true }).click();
      await expect(page.locator('#burger')).toHaveAttribute('aria-expanded', 'false');
      await expectLanded(page, id);
      await checkComparar(page, id);
      expect(new URL(page.url()).hash).toBe(`#${id}`);
      await expect(page.locator('body')).not.toHaveClass(/toyota-scroll-locked/);
    });
  });
});
