// @ts-check
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT || 8000);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const CI = !!process.env.CI;

// Si BASE_URL apunta a otro host (preview, Pages), no se levanta el servidor local.
const useLocalServer = !process.env.BASE_URL;

// El Chromium lo resuelve Playwright (versión fijada en package.json).
// CHROMIUM_PATH permite forzar un binario propio. Solo aplica a los proyectos de Chromium:
// `--no-sandbox` y `executablePath` romperían Firefox/WebKit.
const chromiumLaunch = {
  args: ['--no-sandbox'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
};

// Cross-browser (Firefox + WebKit): solo con CROSS_BROWSER=1 (`npm run test:cross`), porque exige
// `npx playwright install --with-deps firefox webkit`. Cubre navegación, menú móvil, hero quieto y
// formularios, a 1440 y a 390.
const CROSS = process.env.CROSS_BROWSER === '1';
const CROSS_SPECS = /(navegacion|hero|formularios)\.spec\.js$/;
const D1440 = { width: 1440, height: 900 };
const M390 = { width: 390, height: 844 };

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'build-report/test-results',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'build-report/playwright' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'build-report/playwright' }]],

  use: {
    baseURL: BASE_URL,
    locale: 'es-AR',
    // El sitio calcula "abierto/cerrado" en America/Argentina/Buenos_Aires; se fija para que
    // los tests no dependan de la zona horaria de quien los corre.
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: D1440, launchOptions: chromiumLaunch },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: M390,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        launchOptions: chromiumLaunch,
      },
    },
    ...(CROSS
      ? [
          { name: 'firefox-1440', testMatch: CROSS_SPECS, use: { browserName: 'firefox', viewport: D1440 } },
          // Firefox no soporta `isMobile`: se emula solo el viewport y el touch.
          { name: 'firefox-390', testMatch: CROSS_SPECS, use: { browserName: 'firefox', viewport: M390, hasTouch: true } },
          { name: 'webkit-1440', testMatch: CROSS_SPECS, use: { browserName: 'webkit', viewport: D1440 } },
          {
            name: 'webkit-390',
            testMatch: CROSS_SPECS,
            use: { browserName: 'webkit', viewport: M390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
          },
        ]
      : []),
  ],

  webServer: useLocalServer
    ? {
        command: 'node tests/support/server.mjs',
        url: BASE_URL,
        reuseExistingServer: !CI,
        timeout: 30_000,
        env: { PORT: String(PORT) },
      }
    : undefined,
});
