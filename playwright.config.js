// @ts-check
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT || 8000);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const CI = !!process.env.CI;

// Si BASE_URL apunta a otro host (preview, Pages), no se levanta el servidor local.
const useLocalServer = !process.env.BASE_URL;

// El Chromium lo resuelve Playwright (versión fijada en package.json).
// CHROMIUM_PATH permite forzar un binario propio.
const launchOptions = {
  args: ['--no-sandbox'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
};

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
    launchOptions,
  },

  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
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
