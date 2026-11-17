import { test, expect } from '@playwright/test';

// Événements pointeur synthétiques : stylet (pen) et doigts/paume (touch) sur la couche d'encre.
async function openNote(page) {
  await page.goto('/index.html');
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await page.getByRole('button', { name: '＋ Note' }).click();
  await page.getByRole('button', { name: 'Créer' }).click();
  await expect(page.locator('canvas.ed-ink')).toBeVisible();
}
const fire = (page, list) => page.evaluate(list => {
  const c = document.querySelector('canvas.ed-ink'), r = c.getBoundingClientRect();
  for (const [type, id, kind, x, y] of list)
    c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: kind, clientX: r.left + x, clientY: r.top + y, pressure: kind === 'pen' ? 0.5 : 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, isPrimary: kind === 'pen' || id === 1 }));
}, list);
const state = page => page.evaluate(() => { const d = window.__replay.NB.editor.debug(); return { strokes: d.strokes.length, s: d.view.s, tx: d.view.tx, ty: d.view.ty }; });
const penStroke = (id, x, y) => [['pointerdown', id, 'pen', x, y], ...Array.from({ length: 12 }, (_, i) => ['pointermove', id, 'pen', x + 10 * (i + 1), y + 4 * (i % 3)]), ['pointerup', id, 'pen', x + 130, y]];

test('la paume qui pince puis le stylet qui se pose : pas de zoom, le trait est écrit', async ({ page }) => {
  await openNote(page);
  await fire(page, penStroke(10, 200, 200)); // le stylet a déjà servi
  await page.waitForTimeout(500);
  const v0 = await state(page);
  await fire(page, [['pointerdown', 1, 'touch', 500, 500], ['pointerdown', 2, 'touch', 560, 540]]);
  await fire(page, penStroke(11, 250, 300).slice(0, 6));
  await fire(page, [['pointermove', 1, 'touch', 400, 420], ['pointermove', 2, 'touch', 700, 640]]); // la paume « pince »
  await fire(page, penStroke(11, 250, 300).slice(6));
  await fire(page, [['pointerup', 1, 'touch', 400, 420], ['pointerup', 2, 'touch', 700, 640]]);
  const v1 = await state(page);
  expect(v1.strokes).toBe(2);
  expect(v1.s).toBe(v0.s);
});

test('un contact de paume juste après le stylet ne fait pas défiler', async ({ page }) => {
  await openNote(page);
  await fire(page, penStroke(10, 200, 200));
  const v0 = await state(page);
  await fire(page, [['pointerdown', 1, 'touch', 500, 500], ['pointermove', 1, 'touch', 500, 300], ['pointerup', 1, 'touch', 500, 300]]);
  const v1 = await state(page);
  expect([v1.tx, v1.ty]).toEqual([v0.tx, v0.ty]);
});

test('toucher à deux doigts : annule seulement si les deux doigts se posent ensemble, loin du stylet', async ({ page }) => {
  await openNote(page);
  await fire(page, penStroke(10, 200, 200));
  // deux contacts brefs juste après le stylet (paume) : rien n'est annulé
  await page.waitForTimeout(400);
  await fire(page, [['pointerdown', 1, 'touch', 500, 500], ['pointerdown', 2, 'touch', 560, 500], ['pointerup', 1, 'touch', 500, 500], ['pointerup', 2, 'touch', 560, 500]]);
  expect((await state(page)).strokes).toBe(1);
  // vrai geste, plus d'une seconde après le stylet : annule
  await page.waitForTimeout(1100);
  await fire(page, [['pointerdown', 1, 'touch', 500, 500], ['pointerdown', 2, 'touch', 560, 500], ['pointerup', 1, 'touch', 500, 500], ['pointerup', 2, 'touch', 560, 500]]);
  expect((await state(page)).strokes).toBe(0);
});
