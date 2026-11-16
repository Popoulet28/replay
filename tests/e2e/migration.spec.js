import { test, expect } from '@playwright/test';
import { seedV4 } from './helpers.js';

test('les données de l’ancienne version sont reprises intactes après mise à jour', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await seedV4(page);
  const before = await page.evaluate(() => localStorage.getItem('replay-notebook-v1'));
  await page.goto('/index.html');

  await expect(page.locator('#status b')).toHaveText('1 problème');
  const state = await page.evaluate(() => ({ mode: window.__replay.S.mode, notice: window.__replay.S.notice, settings: window.__replay.S.settings, problems: [...window.__replay.S.problems.values()] }));
  expect(state.mode).toBe('local'); expect(state.notice).toBe(null);
  expect(state.settings.dailyLimit).toBe(2); expect(state.settings.reviewMode).toBe('full');
  expect(state.settings.customTopics).toEqual({ 'Mécanique I': ['Marées'] });
  expect(state.settings.extraCourses).toEqual(['Physique numérique']);
  expect(state.settings.tasks).toHaveLength(1);
  const pa = state.problems.find(p => p.id === 'pa'), pb = state.problems.find(p => p.id === 'pb');
  expect(pa.srs).toEqual({ ease: 2.1, interval: 1, reps: 0, lapses: 1, due: '2026-11-02', last: '2026-11-01' });
  expect(pa.history).toEqual([{ d: '2026-11-01', r: 'again', m: 'quick' }]);
  expect(pb.course).toBe('Thermodynamique I'); expect(pb.topics).toEqual(['Gaz parfait']); expect(pb.archived).toBe(true);

  // l'ancien bloc est toujours là, à l'octet près
  expect(await page.evaluate(() => localStorage.getItem('replay-notebook-v1'))).toBe(before);

  // la photo de l'énoncé s'affiche (chargée à la demande)
  await page.locator('#nav button', { hasText: 'Carnet' }).click();
  const thumb = page.locator('.item img.thumb').first();
  await expect(thumb).toHaveJSProperty('complete', true);
  await expect.poll(() => thumb.evaluate(i => i.naturalWidth)).toBe(1);

  // la note de cours et son trait sont là
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await expect(page.locator('.nb-tile .nb-name')).toHaveText('Cours du 3 novembre');
  await page.locator('.nb-tile').first().click();
  await expect(page.locator('canvas.ed-ink')).toBeVisible();
  const dbg = await page.evaluate(() => { const d = window.__replay.NB.editor.debug(); return { strokes: d.strokes.length, items: d.items.length }; });
  expect(dbg).toEqual({ strokes: 1, items: 2 });
  expect(errors).toEqual([]);
});

test('une révision faite après la mise à jour survit au rechargement', async ({ page }) => {
  await seedV4(page);
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('button', { name: 'Voir la solution' }).click();
  await page.locator('.rate button.good').click();
  await expect(page.locator('#view')).toContainText('Session terminée');
  await page.reload();
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const pa = await page.evaluate(() => window.__replay.S.problems.get('pa'));
  expect(pa.history).toHaveLength(2);
  expect(pa.srs.reps).toBe(1);
});

test('ancien carnet illisible : alerte claire, rien d’effacé', async ({ page }) => {
  await seedV4(page);
  await page.evaluate(() => localStorage.setItem('replay-notebook-v1', '{"settings":{},"problems":{"pa":{"id":"pa","cour'));
  await page.goto('/index.html');
  await expect(page.locator('.card.notice.err')).toContainText('illisible');
  expect(await page.evaluate(() => localStorage.getItem('replay-notebook-v1'))).toBe('{"settings":{},"problems":{"pa":{"id":"pa","cour');
});
