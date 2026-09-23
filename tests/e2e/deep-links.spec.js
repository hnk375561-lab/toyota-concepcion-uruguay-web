// @ts-check
/** Deep links: abrir el sitio directamente en un hash y que aterrice bien (tabs incluidos). */
import { test, expect } from '../support/fixtures.js';
import { openSite, expectLanded } from '../support/helpers.js';

const IDS = [
  'gama', 'financiacion', 'canje', 'usados', 'novedades', 'como-comprar',
  'servicios', 'repuestos', 'neumaticos', 'accesorios', 'taller',
  'porque', 'instalaciones', 'testimonios',
  'concesionario', 'mantenimiento', 'faq', 'ubicacion', 'contacto',
];

test.describe('Deep links a secciones y tabs', () => {
  for (const id of IDS) {
    test(`/#${id}`, async ({ page, isMobile }) => {
      await openSite(page, `#${id}`, { mobile: isMobile });
      await expectLanded(page, id);
    });
  }
});

test.describe('Deep links con estado', () => {
  test('/#comparar abre el comparador', async ({ page, isMobile }) => {
    await openSite(page, '#comparar', { mobile: isMobile });
    await expect(page.locator('#compareDisclosureButton')).toHaveAttribute('aria-expanded', 'true');
    await expectLanded(page, 'comparar');
  });

  test('/#comparar?a=Hilux&b=RAV4 precarga y renderiza la comparación', async ({ page, isMobile }) => {
    await openSite(page, '#comparar?a=Hilux&b=RAV4', { mobile: isMobile });
    await expect(page.locator('#compareA')).toHaveValue('Hilux');
    await expect(page.locator('#compareB')).toHaveValue('RAV4');
    await expect(page.locator('#compareResult')).toBeVisible();
    await expect(page.locator('.compare-detail-table thead th')).toHaveText(['Eje técnico', 'Hilux', 'RAV4']);
  });

  test('/#comparar?a=Hilux&b=Land-Cruiser-300 ignora el modelo excluido', async ({ page, isMobile }) => {
    await openSite(page, '#comparar?a=Hilux&b=Land-Cruiser-300', { mobile: isMobile });
    await expect(page.locator('#compareA')).toHaveValue('Hilux');
    await expect(page.locator('#compareB')).toHaveValue('');
  });

  test('/#gama?filter=suv aplica el filtro', async ({ page, isMobile }) => {
    await openSite(page, '#gama?filter=suv', { mobile: isMobile });
    await expect(page.locator('#gama-grid .model:not([hidden])')).toHaveCount(5);
    await expect(page.locator('#filterbar .filterbtn[data-filter="suv"]')).toHaveAttribute('aria-pressed', 'true');
    await expectLanded(page, 'gama');
  });

  test('/#modelo/hilux abre la ficha del modelo al entrar directo', async ({ page, isMobile }) => {
    await openSite(page, '#modelo/hilux', { mobile: isMobile });
    await expect(page.locator('#modelDetail')).toHaveClass(/open/);
    await expect(page.locator('#detailTitle')).toHaveText('Hilux');
  });

  test('/#modelo/no-existe no abre nada y cae en #gama sin romper la página', async ({ page, isMobile }) => {
    await openSite(page, '#modelo/no-existe', { mobile: isMobile });
    await expect(page.locator('#modelDetail')).not.toHaveClass(/open/);
    await expectLanded(page, 'gama');
  });

  test('un hash inexistente no rompe la página', async ({ page, isMobile }) => {
    await openSite(page, '#no-existe-esta-seccion', { mobile: isMobile });
    await expect(page.locator('h1#hero-title')).toBeVisible();
  });

  test('cambiar el hash con la página abierta navega a la nueva sección', async ({ page, isMobile }) => {
    await openSite(page, '#gama', { mobile: isMobile });
    await expectLanded(page, 'gama');
    await page.evaluate(() => { location.hash = '#servicios'; });
    await expectLanded(page, 'servicios');
    await page.evaluate(() => { location.hash = '#canje'; });
    await expectLanded(page, 'canje');
  });
});
