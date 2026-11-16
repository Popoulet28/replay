import { test, expect } from '@playwright/test';

// Aucune requête réseau externe ne doit être nécessaire : on les bloque pour le prouver.
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
});

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
}

test('l’appli démarre sans erreur et affiche l’accueil', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await expect(page.locator('#view h1')).toHaveText('Tes erreurs, en replay.');
  await expect(page.locator('#nav button')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('tous les onglets s’affichent sans erreur', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  for (const name of ['Cours', 'Ajouter', 'Carnet', 'Agenda', 'Outils', 'Profil', 'Aujourd’hui']) {
    await page.locator('#nav button', { hasText: name }).click();
    await expect(page.locator('#view')).not.toBeEmpty();
  }
  await page.locator('#gear').click();
  await expect(page.locator('#view h2')).toHaveText('Réglages');
  expect(errors).toEqual([]);
});

test('ajouter un problème, le retrouver après rechargement, le réviser', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('#nav button', { hasText: 'Ajouter' }).click();
  await page.locator('textarea').first().fill('Un satellite en orbite circulaire : trouver sa période.');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('#status b')).toHaveText('1 problème');

  await page.reload();
  await expect(page.locator('#status b')).toHaveText('1 problème');
  await page.locator('#nav button', { hasText: 'Carnet' }).click();
  await page.locator('.item').first().click();
  await page.getByRole('button', { name: 'Refaire maintenant' }).click();
  await expect(page.locator('#view')).toContainText('Un satellite en orbite circulaire');
  await page.getByRole('button', { name: 'Voir la solution' }).click();
  await page.locator('.rate button.good').click();
  await expect(page.locator('#view')).toContainText('Session terminée');
  expect(errors).toEqual([]);
});

test('créer une note, y écrire un trait, la retrouver', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/index.html');
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await page.getByRole('button', { name: '＋ Note' }).click();
  await page.getByRole('button', { name: 'Créer' }).click();
  const ink = page.locator('canvas.ed-ink');
  await expect(ink).toBeVisible();
  const box = await ink.boundingBox();
  await page.mouse.move(box.x + 300, box.y + 300);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(box.x + 300 + i * 8, box.y + 300 + Math.sin(i / 3) * 30);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.locator('.nb-tile')).toHaveCount(1);

  await page.reload();
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await page.locator('.nb-tile').first().click();
  await expect(page.locator('canvas.ed-ink')).toBeVisible();
  const n = await page.evaluate(() => window.__replay.NB.editor.debug().strokes.length);
  expect(n).toBe(1);
  expect(errors).toEqual([]);
});
