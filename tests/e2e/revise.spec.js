import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Révise (l'ancienne appli Windows) est versionnée telle quelle dans revise/ en attendant sa fusion.
const index = pathToFileURL(path.resolve('revise/app/index.html')).href;

test('Révise démarre, affiche les formules et monte une simulation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(index);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.goto(index + '#/c/mecanique/mouvement');
  await expect(page.locator('h1')).toHaveText('1. Description du mouvement');
  expect(await page.locator('.katex').count()).toBeGreaterThan(20);
  await expect(page.locator('.viz canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Révise : toutes les simulations se montent sans erreur', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(index);
  /* global VIZ */
  const result = await page.evaluate(() => {
    const names = Object.keys(VIZ); const failed = [];
    for (const n of names) {
      const host = document.createElement('div'); host.className = 'viz'; document.body.append(host);
      try { VIZ[n](host); } catch (e) { failed.push(n + ': ' + e.message); }
      host.remove();
    }
    return { count: names.length, failed };
  });
  expect(result.failed).toEqual([]);
  expect(result.count).toBe(30);
  expect(errors).toEqual([]);
});
