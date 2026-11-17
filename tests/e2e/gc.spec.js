import { test, expect } from '@playwright/test';
import { seedV4 } from './helpers.js';

test('le nettoyage supprime les fichiers orphelins anciens et garde le reste', async ({ page }) => {
  await seedV4(page);
  const old = Date.now() - 3 * 86400000, recent = Date.now() - 60000;
  const k = (p, t) => p + ':p' + t.toString(36) + 'abcde';
  const keys = { orphanBlob: k('b', old), usedBlob: k('b', old - 1), recentBlob: k('lo', recent), orphanImg: k('idb', old), usedImg: k('idb', old - 2) };
  await page.evaluate(async (keys) => {
    const put = (db, store, key) => new Promise((res, rej) => { const r = indexedDB.open(db); r.onsuccess = () => { const t = r.result.transaction(store, 'readwrite'); t.objectStore(store).put(new Blob(['x']), key); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); }; });
    for (const key of [keys.orphanBlob, keys.usedBlob, keys.recentBlob]) await put('replay-notes', 'blobs', key);
    for (const key of [keys.orphanImg, keys.usedImg]) await put('replay-images', 'img', key);
    // la note utilise usedBlob ; un problème du carnet utilise usedImg
    await new Promise(res => { const r = indexedDB.open('replay-notes'); r.onsuccess = () => { const t = r.result.transaction('docs', 'readwrite'); const st = t.objectStore('docs');
      const g = st.get('n1'); g.onsuccess = () => { const d = g.result; d.items.push({ id: 'im', kind: 'img', img: keys.usedBlob, x: 0, y: 0, w: 10, h: 10 }); st.put(d, 'n1'); }; t.oncomplete = () => { r.result.close(); res(); }; }; });
    const o = JSON.parse(localStorage.getItem('replay-notebook-v1')); o.problems.pb.solutionImg = keys.usedImg; localStorage.setItem('replay-notebook-v1', JSON.stringify(o));
  }, keys);
  await page.goto('/index.html');
  await expect(page.locator('#status b')).toHaveText('1 problème');
  const r = await page.evaluate(() => window.__replay.collectGarbage());
  expect(r).toEqual({ images: 1, blobs: 1 });
  const left = await page.evaluate(async () => {
    const all = (db, store) => new Promise(res => { const r = indexedDB.open(db); r.onsuccess = () => { const q = r.result.transaction(store).objectStore(store).getAllKeys(); q.onsuccess = () => { r.result.close(); res(q.result.sort()); }; }; });
    return { blobs: await all('replay-notes', 'blobs'), imgs: await all('replay-images', 'img') };
  });
  expect(left.blobs).toEqual([keys.recentBlob, keys.usedBlob].sort());
  expect(left.imgs).toEqual(['idb:img1', keys.usedImg].sort());
});
