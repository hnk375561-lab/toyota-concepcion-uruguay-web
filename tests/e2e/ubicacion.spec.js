// @ts-check
/**
 * Ubicación: todos los enlaces a Google Maps abren la ficha del negocio
 * (`location.mapsPlaceUrl` en data/dealership.json) o, puntualmente, la vista
 * de opiniones de esa misma ficha (`location.mapsReviewsUrl`) en el botón de
 * reseñas. Ninguno debe ser una búsqueda por dirección en texto.
 * El iframe embebido (google.com/maps?q=…&output=embed) y Apple Maps quedan fuera de esta regla.
 */
import { readFileSync } from 'node:fs';
import { test, expect } from '../support/fixtures.js';
import { openSite } from '../support/helpers.js';

const dealership = JSON.parse(readFileSync(new URL('../../data/dealership.json', import.meta.url), 'utf8'));
const PLACE_URL = dealership.location.mapsPlaceUrl;
const REVIEWS_URL = dealership.location.mapsReviewsUrl;

test.describe('Ubicación en Google Maps', () => {
  test('todos los enlaces a Google Maps apuntan a la ficha del negocio', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="google.com/maps"]')].map((a) => a.getAttribute('href')));
    expect(hrefs.length, 'hay enlaces a Google Maps en la página').toBeGreaterThanOrEqual(7);
    expect(hrefs.filter((h) => h !== PLACE_URL && h !== REVIEWS_URL)).toEqual([]);
    expect(hrefs.filter((h) => /maps\/(search|dir)/.test(h ?? ''))).toEqual([]);
  });

  test('"Compartir" comparte la ficha del negocio, no la URL del sitio', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (payload) => { /** @type {any} */ (window).__shared = payload; return Promise.resolve(); },
      });
    });
    await openSite(page, '', { mobile: isMobile });
    // click por JS: evita depender de que el botón no quede tapado por barras flotantes.
    await page.locator('#shareBtn').evaluate((el) => /** @type {HTMLElement} */ (el).click());
    const shared = await page.evaluate(() => /** @type {any} */ (window).__shared);
    expect(shared).toMatchObject({ title: 'Piñeyro y Moscatelli', url: PLACE_URL });
  });

  test('el QR de la sección Ubicación está presente y etiquetado', async ({ page, isMobile }) => {
    await openSite(page, '', { mobile: isMobile });
    const qr = page.locator('#ubicacion .location-qr svg');
    await expect(qr).toHaveCount(1);
    await expect(qr).toHaveAttribute('aria-label', 'Código QR para abrir la ubicación en Google Maps');
  });
});
