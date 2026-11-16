import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { seedV4 } from './helpers.js';

const tmp = name => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'replay-')), name);
const snapshot = page => page.evaluate(async () => {
  const { S, NB } = window.__replay;
  const dbs = (await indexedDB.databases()).map(d => d.name).filter(n => n.startsWith('replay-')).sort();
  return { problems: [...S.problems.values()].sort((a, b) => a.id.localeCompare(b.id)), settings: S.settings, nodes: [...NB.nodes.values()].map(n => n.name).sort(), dbs, gen: localStorage.getItem('replay-generation') || '' };
});
async function exportBackup(page) {
  await page.locator('#gear').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter une sauvegarde' }).click()]);
  const file = tmp(dl.suggestedFilename()); await dl.saveAs(file);
  await expect(page.locator('.modal')).toHaveCount(0);
  return file;
}
async function restore(page, file) {
  await page.locator('#gear').click();
  await page.locator('input[type=file][accept*="zip"]').setInputFiles(file);
  await page.locator('.modal').getByRole('button', { name: 'Restaurer' }).click();
}
async function addProblem(page, text) {
  await page.locator('#nav button', { hasText: 'Ajouter' }).click();
  await page.locator('textarea').first().fill(text);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
}

test('export puis restauration : tout revient, les données d’avant restent récupérables', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await seedV4(page);
  await page.goto('/index.html');
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const original = await snapshot(page);
  const file = await exportBackup(page);
  expect(fs.statSync(file).size).toBeGreaterThan(500);
  expect(path.basename(file)).toMatch(/^replay-sauvegarde-\d{4}-\d{2}-\d{2}\.zip$/);

  // on modifie : un problème en plus, la note supprimée
  await addProblem(page, 'Problème ajouté après la sauvegarde');
  await expect(page.locator('#status b')).toHaveText('2 problèmes');
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await page.locator('.nb-more').first().click();
  await page.locator('.modal').getByRole('button', { name: 'Supprimer' }).click();
  await page.locator('.modal').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.locator('.nb-tile')).toHaveCount(0);
  const modified = await snapshot(page);

  // restauration : l'appli se recharge sur les données de la sauvegarde
  await Promise.all([page.waitForEvent('load'), restore(page, file)]);
  await expect(page.locator('.card.notice')).toContainText('Sauvegarde restaurée');
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const restored = await snapshot(page);
  expect(restored.gen).not.toBe('');
  const strip = s => ({ ...s, backup: undefined, game: undefined }); // champs écrits après coup par l'appli
  expect(restored.problems).toEqual(original.problems);
  expect(strip(restored.settings)).toEqual(strip(original.settings));
  expect(restored.nodes).toEqual(['Cours du 3 novembre']);
  // la photo et le trait sont bien dans la copie restaurée
  await page.locator('#nav button', { hasText: 'Carnet' }).click();
  await expect.poll(() => page.locator('.item img.thumb').first().evaluate(i => i.naturalWidth)).toBe(1);
  await page.locator('#nav button', { hasText: 'Cours' }).click();
  await page.locator('.course-card').first().click();
  await page.locator('.nb-tile').first().click();
  await expect(page.locator('canvas.ed-ink')).toBeVisible();
  expect(await page.evaluate(() => window.__replay.NB.editor.debug().strokes.length)).toBe(1);
  await page.getByRole('button', { name: 'Retour' }).click();

  // les données d'avant la restauration sont toujours là : on y revient
  await page.locator('#gear').click();
  await page.getByRole('button', { name: 'Revenir à ces données' }).click();
  await Promise.all([page.waitForEvent('load'), page.locator('.modal').getByRole('button', { name: 'Revenir' }).click()]);
  await expect(page.locator('#status b')).toHaveText('2 problèmes');
  const back = await snapshot(page);
  expect(back.gen).toBe('');
  expect(back.problems.map(p => p.id)).toEqual(modified.problems.map(p => p.id));
  expect(back.nodes).toEqual([]);

  // puis on libère la place prise par l'autre copie
  await page.locator('#gear').click();
  await page.getByRole('button', { name: 'Tout va bien, libérer la place' }).click();
  await page.locator('.modal').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByRole('button', { name: 'Revenir à ces données' })).toHaveCount(0);
  expect((await snapshot(page)).dbs).toEqual(['replay-carnet', 'replay-images', 'replay-notes']);
  expect(errors).toEqual([]);
});

test('une sauvegarde abîmée est refusée et ne touche à rien', async ({ page }) => {
  await seedV4(page);
  await page.goto('/index.html');
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const file = await exportBackup(page);
  const before = await snapshot(page);

  const raw = fs.readFileSync(file);
  const cases = {
    'tronquee.zip': raw.subarray(0, Math.floor(raw.length * 0.6)),
    'alteree.zip': (() => { const b = Buffer.from(raw); const i = b.indexOf('Cours du 3 novembre'); b[i] ^= 0x20; return b; })(),
    'autre.zip': Buffer.from('ceci n’est pas une sauvegarde'),
  };
  for (const [name, bytes] of Object.entries(cases)) {
    const bad = tmp(name); fs.writeFileSync(bad, bytes);
    await restore(page, bad);
    await expect(page.locator('.toast.err').last()).toContainText('Restauration impossible');
    await expect(page.locator('.modal')).toHaveCount(0);
    const after = await snapshot(page);
    expect(after.gen, name).toBe('');
    expect(after.problems, name).toEqual(before.problems);
    expect(after.nodes, name).toEqual(before.nodes);
    expect(after.dbs, name).toEqual(['replay-carnet', 'replay-images', 'replay-notes']);
  }
  await page.reload();
  await expect(page.locator('#status b')).toHaveText('1 problème');
});

test('une restauration interrompue ne laisse pas de bases orphelines', async ({ page }) => {
  await seedV4(page);
  await page.goto('/app.css');
  await page.evaluate(() => new Promise(res => { const r = indexedDB.open('replay-notes@gperdu', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => { r.result.close(); res(); }; }));
  await page.goto('/index.html');
  await expect(page.locator('#status b')).toHaveText('1 problème');
  await expect.poll(async () => (await snapshot(page)).dbs).toEqual(['replay-carnet', 'replay-images', 'replay-notes']);
});

test('l’ancien format .json se restaure encore', async ({ page }) => {
  await seedV4(page);
  await page.goto('/index.html');
  const file = tmp('replay-sauvegarde-2026-01-01.json');
  fs.writeFileSync(file, JSON.stringify({ app: 'replay', v: 1, settings: { dailyLimit: 4 }, problems: { z1: { id: 'z1', course: 'Mechanics I', topic: 'Oscillations', problemText: 'Pendule', history: [], srs: { ease: 2.3, interval: 0, reps: 0, lapses: 0, due: '2026-01-02', last: null }, archived: false } }, images: {} }));
  await restore(page, file);
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const s = await snapshot(page);
  expect(s.problems.map(p => [p.id, p.course, p.topics])).toEqual([['z1', 'Mécanique I', ['Oscillations']]]);
  expect(s.settings.dailyLimit).toBe(4);
  expect(s.nodes).toEqual(['Cours du 3 novembre']);
  await page.reload();
  await expect(page.locator('#status b')).toHaveText('1 problème');
  expect((await snapshot(page)).problems[0].id).toBe('z1');
});
