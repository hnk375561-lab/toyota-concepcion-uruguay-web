// @ts-check
/**
 * hilux.html (ficha hecha a mano): axe A/AA, quiz, configurador, estilos que antes faltaban
 * y los datos que ya se corrigieron contra la ficha oficial de Toyota Argentina.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/fixtures.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function abrir(page) {
  await page.goto('/hilux.html', { waitUntil: 'load' });
  await expect(page.locator('h1')).toHaveText('Toyota Hilux');
}

test('sin placeholders ni datos que ya se corrigieron', async ({ page }) => {
  await abrir(page);
  const texto = await page.locator('main').innerText();
  for (const malo of ['[Completar', '{{', 'AHB', '12,8 m', '+140/+150', '2.910 kg', '+20 mm']) {
    expect(texto, `no debe aparecer "${malo}"`).not.toContain(malo);
  }
  for (const bueno of ['6,7 m', '+140/+155', '3.090 kg', '3.140 kg', '2.020 mm', '265/65 R17 AT']) {
    expect(texto, `debe aparecer "${bueno}"`).toContain(bueno);
  }
});

test('JSON-LD: Vehicle sin InStock y FAQPage sincronizado con el FAQ visible', async ({ page }) => {
  await abrir(page);
  const ld = await page.$$eval('script[type="application/ld+json"]', (n) => n.map((s) => JSON.parse(s.textContent || '{}')));
  const veh = ld.find((x) => x['@type'] === 'Vehicle');
  expect(veh.offers.availability).toBeUndefined();
  expect(veh.vehicleEngine.length).toBeGreaterThan(0);
  expect(veh.wheelbase.value).toBe(3085);
  const faq = ld.find((x) => x['@type'] === 'FAQPage');
  expect(faq.mainEntity.length).toBe(await page.locator('#hiluxFaqList .faq-item').count());
});

test('estilos del quiz, configurador y garantía llegan al render', async ({ page }) => {
  await abrir(page);
  const disp = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).display);
  expect(await disp('.quiz-opts')).toBe('grid');
  expect(await disp('.warranty-grid')).toBe('grid');
  expect(await disp('.configurator-form')).toBe('grid');
  expect(await page.locator('.configurator-form select').first().evaluate((el) => getComputedStyle(el).appearance)).toBe('none');
});

test('quiz: llega a una versión y arma el WhatsApp', async ({ page }) => {
  await abrir(page);
  for (const q of ['q1', 'q2', 'q3', 'q4']) await page.locator(`input[name="${q}"][value="offroad"]`).check();
  await page.getByRole('button', { name: 'Ver mi versión sugerida' }).click();
  const res = page.locator('#quizResult');
  await expect(res).toBeVisible();
  await expect(res).toContainText('GR-Sport');
  expect(await res.locator('a').getAttribute('href')).toContain('wa.me/5493442473453');
});

test('configurador: tracción y colores según la versión', async ({ page }) => {
  await abrir(page);
  const color = page.locator('#cfgColor option');
  const drive = page.locator('#cfgDrive option');
  await page.locator('#cfgVersion').selectOption('GR-Sport');
  await expect(drive).toHaveText(['4x4']);
  await expect(color).toHaveText(['Negro Mica', 'Gris Oscuro Metalizado', 'Rojo bitono (techo negro)', 'Blanco Perlado con techo negro']);
  await page.locator('#cfgVersion').selectOption('SRV');
  await page.locator('#cfgDrive').selectOption('4x2');
  expect(await color.allTextContents()).not.toContain('Blanco Perlado');
  await page.locator('#cfgDrive').selectOption('4x4');
  expect(await color.allTextContents()).toContain('Blanco Perlado');
  await page.locator('#cfgVersion').selectOption('SRX');
  await page.locator('#cfgDrive').selectOption('4x2');
  await expect(page.locator('#cfgSummary')).toContainText('Sin Toyota Safety Sense');
  expect(decodeURIComponent((await page.locator('#cfgWhatsApp').getAttribute('href')) || '')).toContain('versión SRX 4x2');
});

test('la nav de la ficha llega a Datos verificados y Documentos', async ({ page }) => {
  await abrir(page);
  const links = await page.locator('.ficha-jumpnav a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  for (const id of ['#pesos-capacidades', '#postventa', '#datos-verificados', '#documentos']) expect(links).toContain(id);
  for (const a of links.filter((h) => h && h.startsWith('#'))) expect(await page.locator(a).count(), a).toBe(1);
});

for (const reduced of [false, true]) {
  test(`axe WCAG A/AA (${reduced ? 'reduced-motion' : 'motion normal'})`, async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await abrir(page);
    const alto = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= alto; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(r.violations.map((v) => `${v.id} x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
