// @ts-check
/** Formularios: contacto (motivo → número y mensaje de WhatsApp) y tasación (plan canje). */
import { test, expect } from '../support/fixtures.js';
import { openSite, expectLanded, parseWa, CANALES } from '../support/helpers.js';

/** value del <select>, canal, frase que arma el sitio */
const MOTIVOS = [
  ['turnos', 'ventas', 'Quiero solicitar un turno de service.'],
  ['0km', 'ventas', 'Quiero consultar por un Toyota 0 km.'],
  ['usados', 'ventas', 'Quiero consultar por un vehículo usado disponible.'],
  ['financiacion', 'ventas', 'Quiero consultar opciones de financiación para un Toyota.'],
  ['canje', 'ventas', 'Quiero tasar mi vehículo para un plan canje.'],
  ['repuestos', 'repuestos', 'Quiero consultar por un repuesto genuino Toyota.'],
  ['accesorios', 'repuestos', 'Quiero consultar por accesorios Toyota.'],
  ['neumaticos', 'neumaticos', 'Quiero consultar por neumáticos Bridgestone.'],
  ['general', 'ventas', 'Quiero realizar una consulta general.'],
];

async function enviarYCapturar(page, submit) {
  const [popup] = await Promise.all([page.waitForEvent('popup'), submit.click()]);
  await popup.waitForURL(/^https:\/\/wa\.me\//);
  const wa = parseWa(popup.url());
  await popup.close();
  return wa;
}

test.describe('Formulario de contacto', () => {
  test('vacío: no abre WhatsApp, marca los campos y enfoca el nombre', async ({ page, context, mobile }) => {
    await openSite(page, '', { mobile });
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormNote')).toHaveText('Completá tu nombre y el mensaje para continuar.');
    await expect(page.locator('#contactFormNote')).toHaveClass(/form-error/);
    await expect(page.locator('#cName')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cMsg')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cName')).toBeFocused();
    await page.waitForTimeout(400);
    expect(context.pages()).toHaveLength(1);
  });

  test('solo nombre: pide el mensaje y lo enfoca', async ({ page, context, mobile }) => {
    await openSite(page, '', { mobile });
    await page.locator('#cName').fill('Lucía');
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormNote')).toHaveText('Contanos brevemente qué necesitás para continuar.');
    await expect(page.locator('#cMsg')).toBeFocused();
    await expect(page.locator('#cMsg')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cName')).not.toHaveAttribute('aria-invalid', 'true');
    expect(context.pages()).toHaveLength(1);
  });

  test('solo mensaje: pide el nombre y lo enfoca', async ({ page, context, mobile }) => {
    await openSite(page, '', { mobile });
    await page.locator('#cMsg').fill('Quiero una Hilux');
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormNote')).toHaveText('Completá tu nombre para continuar.');
    await expect(page.locator('#cName')).toBeFocused();
    expect(context.pages()).toHaveLength(1);
  });

  test('solo espacios cuenta como vacío', async ({ page, context, mobile }) => {
    await openSite(page, '', { mobile });
    await page.locator('#cName').fill('   ');
    await page.locator('#cMsg').fill('   ');
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormNote')).toHaveText('Completá tu nombre y el mensaje para continuar.');
    expect(context.pages()).toHaveLength(1);
  });

  test('válido en móvil y escritorio: mensaje y número correctos', async ({ page, mobile }) => {
    await openSite(page, '', { mobile });
    await page.locator('#cName').fill('  Ana Pérez  ');
    await page.locator('#cMotivo').selectOption('financiacion');
    await page.locator('#cMsg').fill('Busco una Hilux 4x4 & plan a 48 cuotas');
    const submit = page.locator('#contactForm button[type="submit"]');
    const wa = await enviarYCapturar(page, submit);
    expect(wa.origin).toBe('https://wa.me');
    expect(wa.phone).toBe(CANALES.ventas);
    expect(wa.text).toBe('Hola! Soy Ana Pérez. Quiero consultar opciones de financiación para un Toyota. Detalle: Busco una Hilux 4x4 & plan a 48 cuotas');
    await expect(page.locator('#contactFormNote')).toHaveText('¡Listo! Se abrió WhatsApp con tu consulta ya redactada.');
    await expect(submit).toBeDisabled(); // anti doble envío
    await expect(submit).toBeEnabled({ timeout: 6000 });
  });

  test.describe('motivo → canal', () => {
    test.skip(({ mobile }) => mobile, 'tabla completa solo en escritorio');
    for (const [valor, canal, frase] of MOTIVOS) {
      test(`${valor} → ${canal}`, async ({ page }) => {
        await openSite(page);
        await page.locator('#cName').fill('Test');
        await page.locator('#cMotivo').selectOption(valor);
        await page.locator('#cMsg').fill('Mensaje de prueba');
        const wa = await enviarYCapturar(page, page.locator('#contactForm button[type="submit"]'));
        expect(wa.phone).toBe(CANALES[canal]);
        expect(wa.text).toBe(`Hola! Soy Test. ${frase} Detalle: Mensaje de prueba`);
      });
    }
  });

  test('la vista previa se actualiza con motivo, nombre y mensaje', async ({ page, mobile }) => {
    await openSite(page, '', { mobile });
    const preview = page.locator('#messagePreview');
    await expect(preview).toHaveText('Hola, quiero hacer una consulta general.');
    await page.locator('#cMotivo').selectOption('financiacion');
    await expect(preview).toHaveText('Hola, quiero hacer una consulta por financiación.');
    await page.locator('#cName').fill('Ana');
    await expect(preview).toHaveText('Hola, Ana. Quiero hacer una consulta por financiación.');
    await page.locator('#cMsg').fill('Necesito una Hilux');
    await expect(preview).toHaveText('Hola, Ana. Necesito una Hilux');
    await page.locator('#contactForm [data-reason="canje"]').click();
    await expect(page.locator('#cMotivo')).toHaveValue('canje');
    await expect(page.locator('#contactForm [data-reason="canje"]')).toHaveClass(/is-selected/);
  });
});

test.describe('Formulario de tasación (plan canje)', () => {
  async function abrir(page, mobile) {
    await openSite(page, '#canje', { mobile });
    await expectLanded(page, 'canje');
    await expect(page.locator('#tradeForm')).toBeVisible();
  }

  test('vacío: la validación nativa bloquea el envío', async ({ page, context, mobile }) => {
    await abrir(page, mobile);
    await page.locator('#tradeForm button[type="submit"]').click();
    await expect(page.locator('#tradeCar')).toBeFocused();
    expect(await page.locator('#tradeForm').evaluate((f) => f.checkValidity())).toBe(false);
    await page.waitForTimeout(400);
    expect(context.pages()).toHaveLength(1);
  });

  test('año inválido: mensaje claro y foco en el año', async ({ page, context, mobile }) => {
    await abrir(page, mobile);
    await page.locator('#tradeCar').fill('Toyota Corolla');
    await page.locator('#tradeYear').fill('20');
    await page.locator('#tradeKm').fill('80000');
    await page.locator('#tradeForm button[type="submit"]').click();
    await expect(page.locator('#tradeNote')).toHaveText('El año debe tener 4 dígitos, por ejemplo 2020.');
    await expect(page.locator('#tradeYear')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#tradeYear')).toBeFocused();
    expect(context.pages()).toHaveLength(1);
  });

  test('kilometraje inválido: mensaje claro y foco en el km', async ({ page, context, mobile }) => {
    await abrir(page, mobile);
    await page.locator('#tradeCar').fill('Toyota Corolla');
    await page.locator('#tradeYear').fill('2020');
    await page.locator('#tradeKm').fill('ochenta mil');
    await page.locator('#tradeForm button[type="submit"]').click();
    await expect(page.locator('#tradeNote')).toHaveText('El kilometraje debe contener solo números.');
    await expect(page.locator('#tradeKm')).toBeFocused();
    expect(context.pages()).toHaveLength(1);
  });

  test('válido: mensaje de tasación y número de ventas', async ({ page, mobile }) => {
    await abrir(page, mobile);
    await page.locator('#tradeCar').fill('Toyota Corolla');
    await page.locator('#tradeYear').fill('2020');
    await page.locator('#tradeKm').fill('80000');
    await page.locator('#tradeCondition').selectOption('Bueno');
    await page.locator('#tradeInterest').selectOption('usado');
    const submit = page.locator('#tradeForm button[type="submit"]');
    const wa = await enviarYCapturar(page, submit);
    expect(wa.phone).toBe(CANALES.ventas);
    expect(wa.text).toBe('Hola! Quiero tasar mi vehículo para un plan canje. Vehículo: Toyota Corolla. Año: 2020. Kilometraje: 80000 km. Estado: Bueno. Me interesa a cambio: un usado certificado.');
    await expect(page.locator('#tradeNote')).toHaveText('¡Listo! Se abrió WhatsApp con tu consulta ya redactada.');
    await expect(submit).toBeEnabled({ timeout: 6000 });
  });
});
