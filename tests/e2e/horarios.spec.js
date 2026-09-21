// @ts-check
/**
 * Badge "Abierto/Cerrado ahora" con el reloj fijado por page.clock.
 * Horario publicado: lun-vie 8-12 y 15-19, sáb 8-12, dom cerrado (America/Argentina/Buenos_Aires, UTC-3).
 * Fechas: dom 20/09/2026, lun 21, vie 25, sáb 26.
 */
import { test, expect } from '../support/fixtures.js';

const DOM = '2026-09-20', LUN = '2026-09-21', VIE = '2026-09-25', SAB = '2026-09-26';
const at = (day, hm) => new Date(`${day}T${hm}:00-03:00`);

/** [nombre, fecha, abierto, texto de la nota, fila resaltada (0 lun-vie, 1 sáb, 2 dom)] */
const PEDIDOS = [
  ['dom 11:00', at(DOM, '11:00'), false, 'Abre mañana a las 08:00', 2],
  ['sáb 09:00', at(SAB, '09:00'), true, 'Cierra a las 12:00', 1],
  ['sáb 13:00', at(SAB, '13:00'), false, 'Abre el lunes a las 08:00', 1],
  ['lun 10:00', at(LUN, '10:00'), true, 'Cierra a las 12:00', 0],
  ['lun 12:30', at(LUN, '12:30'), false, 'Abre hoy a las 15:00', 0],
  ['lun 15:30', at(LUN, '15:30'), true, 'Cierra a las 19:00', 0],
  ['vie 19:30', at(VIE, '19:30'), false, 'Abre mañana a las 08:00', 0],
  ['lun 00:30', at(LUN, '00:30'), false, 'Abre hoy a las 08:00', 0],
];

/** Bordes de cada franja: el minuto anterior y el exacto. */
const BORDES = [
  ['lun 07:59', at(LUN, '07:59'), false, 'Abre hoy a las 08:00', 0],
  ['lun 08:00', at(LUN, '08:00'), true, 'Cierra a las 12:00', 0],
  ['lun 11:59', at(LUN, '11:59'), true, 'Cierra a las 12:00', 0],
  ['lun 12:00', at(LUN, '12:00'), false, 'Abre hoy a las 15:00', 0],
  ['lun 14:59', at(LUN, '14:59'), false, 'Abre hoy a las 15:00', 0],
  ['lun 15:00', at(LUN, '15:00'), true, 'Cierra a las 19:00', 0],
  ['lun 18:59', at(LUN, '18:59'), true, 'Cierra a las 19:00', 0],
  ['lun 19:00', at(LUN, '19:00'), false, 'Abre mañana a las 08:00', 0],
  ['sáb 07:59', at(SAB, '07:59'), false, 'Abre hoy a las 08:00', 1],
  ['sáb 08:00', at(SAB, '08:00'), true, 'Cierra a las 12:00', 1],
  ['sáb 12:00', at(SAB, '12:00'), false, 'Abre el lunes a las 08:00', 1],
  ['dom 00:00', at(DOM, '00:00'), false, 'Abre mañana a las 08:00', 2],
];

async function abrirCon(page, fecha) {
  await page.clock.setFixedTime(fecha);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#locationStatusText')).not.toHaveText('Consultando horario');
}

async function verificar(page, [, , abierto, nota, fila]) {
  const box = page.locator('#locationStatus');
  await expect(page.locator('#locationStatusText')).toHaveText(abierto ? 'Abierto ahora' : 'Cerrado ahora');
  await expect(page.locator('#locationStatusNote')).toContainText(nota);
  await expect(box).toHaveClass(abierto ? /is-open/ : /is-closed/);
  await expect(box).not.toHaveClass(abierto ? /is-closed/ : /is-open/);
  await expect(box).toHaveAttribute('aria-label', new RegExp(`^${abierto ? 'Abierto' : 'Cerrado'} ahora · ${nota}$`));
  const filas = page.locator('#ubicacion .hours-table tr');
  await expect(filas).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    if (i === fila) await expect(filas.nth(i)).toHaveClass(/is-today/);
    else await expect(filas.nth(i)).not.toHaveClass(/is-today/);
  }
}

test.describe('Horarios (casos pedidos)', () => {
  for (const caso of PEDIDOS) {
    test(caso[0], async ({ page }) => {
      await abrirCon(page, caso[1]);
      await verificar(page, caso);
    });
  }
});

test.describe('Horarios (bordes de franja)', () => {
  test.skip(({ isMobile }) => isMobile, 'lógica independiente del viewport: se verifica en escritorio');
  for (const caso of BORDES) {
    test(caso[0], async ({ page }) => {
      await abrirCon(page, caso[1]);
      await verificar(page, caso);
    });
  }
});

test.describe('Horarios (zona horaria del visitante)', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });
  test('un visitante en Tokio ve la hora de Buenos Aires (lun 10:00 ART → abierto)', async ({ page }) => {
    await abrirCon(page, at(LUN, '10:00'));
    await verificar(page, PEDIDOS[3]);
  });
});

test('el horario de la tabla visible coincide con el JSON-LD', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const specs = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
    return blocks.find((b) => b['@type'] === 'AutoDealer').openingHoursSpecification;
  });
  const franjas = specs.map((s) => `${[].concat(s.dayOfWeek).join(',')} ${s.opens}-${s.closes}`);
  expect(franjas).toEqual([
    'Monday,Tuesday,Wednesday,Thursday,Friday 08:00-12:00',
    'Monday,Tuesday,Wednesday,Thursday,Friday 15:00-19:00',
    'Saturday 08:00-12:00',
  ]);
  const filas = await page.locator('#ubicacion .hours-table tr').evaluateAll((trs) => trs.map((tr) => [...tr.cells].map((c) => c.textContent.trim()).join(' ')));
  expect(filas).toEqual([
    'Lunes a viernes 8 a 12 y 15 a 19',
    'Sábados 8 a 12',
    'Domingos Cerrado',
  ]);
});
