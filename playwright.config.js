import { defineConfig } from '@playwright/test';

// Les parcours sont joués dans Chrome (même moteur que la WebView Android et WebView2), sur le build réel.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    // en local : le Chrome installé ; en CI : le Chromium fourni par Playwright
    channel: process.env.CI ? undefined : (process.env.PW_CHANNEL || 'chrome'),
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  },
  webServer: {
    command: 'node scripts/build.mjs --serve',
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
