// @ts-check
/** Comparador de modelos: selects, tarjetas, mismo modelo, reset, hash compartible y WhatsApp. */
import { test, expect } from '../support/fixtures.js';
import { openSite, parseWa, CANALES } from '../support/helpers.js';

const MODELOS = ['Hilux', 'SW4 Diamond', 'Corolla Cross', 'RAV4', 'Corolla'];

async function abrir(page, isMobile) {
  await openSite(page, '', { mobile: isMobile });
  await page.locator('#compareDisclosureButton').click();
  await expect(page.locator('#compareDisclosureButton')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#comparar')).toBeVisible();
}

test.describe('Comparador', () => {
  test('ofrece solo los 5 modelos comparables (sin los excluidos)', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    for (const sel of ['#compareA', '#compareB']) {
      const valores = await page.locator(`${sel} option`).evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
      expect(valores).toEqual(MODELOS);
    }
  });

  test('estado inicial: sin resultado y con ayuda visible', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    await expect(page.locator('#compareResult')).toBeHidden();
    await expect(page.locator('#compareEmpty')).toBeVisible();
  });

  test('dos modelos distintos: tabla, botones de WhatsApp y hash compartible', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    await page.locator('#compareA').selectOption('Hilux');
    await page.locator('#compareB').selectOption('SW4 Diamond');
    await expect(page.locator('#compareResult')).toBeVisible();
    await expect(page.locator('#compareEmpty')).toBeHidden();
    await expect(page.locator('.compare-detail-table thead th')).toHaveText(['Eje técnico', 'Hilux', 'SW4 Diamond']);
    expect(await page.locator('.compare-detail-table tbody tr').count()).toBeGreaterThan(3);
    const a = parseWa((await page.locator('#compareWaA').getAttribute('href')) || '');
    const b = parseWa((await page.locator('#compareWaB').getAttribute('href')) || '');
    expect(a.phone).toBe(CANALES.ventas);
    expect(a.text).toBe('Hola! Estoy comparando la Hilux con la SW4 Diamond y quiero consultar por la Hilux.');
    expect(b.text).toBe('Hola! Estoy comparando la Hilux con la SW4 Diamond y quiero consultar por la SW4 Diamond.');
    await expect(page.locator('#compareWaA')).toHaveText('Consultar Hilux ↗');
    expect(await page.evaluate(() => location.hash)).toBe('#comparar?a=Hilux&b=SW4%20Diamond');
  });

  test('MISMO modelo en A y B: pide dos distintos y oculta WhatsApp', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    await page.locator('#compareA').selectOption('Hilux');
    await page.locator('#compareB').selectOption('Hilux');
    await expect(page.locator('#compareTable')).toContainText('Elegí dos modelos distintos para comparar.');
    await expect(page.locator('.compare-detail-table')).toHaveCount(0);
    await expect(page.locator('#compareWaA')).toBeHidden();
    await expect(page.locator('#compareWaB')).toBeHidden();
    // y se recupera al elegir uno distinto
    await page.locator('#compareB').selectOption('RAV4');
    await expect(page.locator('.compare-detail-table')).toBeVisible();
    await expect(page.locator('#compareWaB')).toBeVisible();
  });

  test('tarjetas: 1.º clic llena A, 2.º llena B, 3.º reemplaza B', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('[data-compare-model="Hilux"]').click();
    await expect(page.locator('#compareA')).toHaveValue('Hilux');
    await expect(page.locator('#compareB')).toHaveValue('');
    await expect(page.locator('#compareDisclosureButton')).toHaveAttribute('aria-expanded', 'true');
    await page.locator('[data-compare-model="SW4 Diamond"]').click();
    await expect(page.locator('#compareB')).toHaveValue('SW4 Diamond');
    await expect(page.locator('#compareResult')).toBeVisible();
    await page.locator('[data-compare-model="Corolla Cross"]').click();
    await expect(page.locator('#compareA')).toHaveValue('Hilux');
    await expect(page.locator('#compareB')).toHaveValue('Corolla Cross');
  });

  test('tarjetas: comparar dos veces el MISMO modelo no lo duplica en B', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    await page.locator('[data-compare-model="Hilux"]').click();
    await page.locator('[data-compare-model="Hilux"]').click();
    await expect(page.locator('#compareA')).toHaveValue('Hilux');
    await expect(page.locator('#compareB')).toHaveValue('');
    await expect(page.locator('#compareResult')).toBeHidden();
  });

  test('reiniciar limpia ambos selects y el resultado', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    await page.locator('#compareA').selectOption('Corolla');
    await page.locator('#compareB').selectOption('RAV4');
    await expect(page.locator('#compareResult')).toBeVisible();
    await page.locator('#compareReset').click();
    await expect(page.locator('#compareA')).toHaveValue('');
    await expect(page.locator('#compareB')).toHaveValue('');
    await expect(page.locator('#compareResult')).toBeHidden();
    await expect(page.locator('#compareEmpty')).toBeVisible();
  });

  test('el disclosure se abre y se cierra', async ({ page, isMobile }) => {
    await abrir(page, isMobile);
    await page.locator('#compareDisclosureButton').click();
    await expect(page.locator('#compareDisclosureButton')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#comparar-panel')).toBeHidden();
  });
});
