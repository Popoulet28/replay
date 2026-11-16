import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDb, dbName, tx, generation, setGeneration, previousGeneration, GEN_KEY } from '../../web/src/core/db.js';
import { openCarnet, migrateFromLocalStorage, loadCarnet, putProblem, deleteProblem, putSettings, writeCarnet, kvGet, readLegacy, LEGACY_LS_KEY } from '../../web/src/core/carnet.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, _m: m };
}
const legacyJson = () => JSON.stringify({
  settings: { dailyLimit: 3, exams: [{ id: 'e1', name: 'Contrôle 1', date: '2026-12-01', course: 'Mécanique I', topics: [] }], tasks: [{ id: 't1', title: 'Série 7', done: true }] },
  problems: {
    p1: { id: 'p1', course: 'Mécanique I', topics: ['Gravitation & Kepler'], problemImg: 'idb:x1', history: [{ d: '2026-11-10', r: 'good', m: 'quick' }], srs: { ease: 2.3, interval: 3, reps: 1, lapses: 0, due: '2026-11-13', last: '2026-11-10' } },
    p2: { id: 'p2', course: 'Thermodynamics I', topic: 'Gaz parfait', problemText: 'Énoncé « accentué » — $PV=nRT$', history: [], srs: { ease: 2.3, interval: 0, reps: 0, lapses: 0, due: '2026-11-17', last: null } },
    p3: { course: 'Analyse', problemImg: 'data:image/jpeg;base64,AAAA', history: [], srs: {} },
  },
});

let db;
beforeEach(async () => {
  if (db) db.close();
  await deleteDb(dbName('replay-carnet', ''));
  globalThis.localStorage = fakeStorage();
  db = await openCarnet('');
});

describe('migration du carnet depuis localStorage', () => {
  it('copie tous les problèmes et les réglages, sans toucher à l’ancien bloc', async () => {
    const raw = legacyJson(); const ls = fakeStorage({ [LEGACY_LS_KEY]: raw });
    const r = await migrateFromLocalStorage(db, ls);
    expect(r).toEqual({ status: 'migrated', count: 3 });
    const data = await loadCarnet(db);
    expect(data.problems.map(p => p.id).sort()).toEqual(['p1', 'p2', 'p3']);
    expect(data.problems.find(p => p.id === 'p1')).toEqual(JSON.parse(raw).problems.p1);
    expect(data.problems.find(p => p.id === 'p2').problemText).toBe('Énoncé « accentué » — $PV=nRT$');
    expect(data.problems.find(p => p.id === 'p3').problemImg).toBe('data:image/jpeg;base64,AAAA');
    expect(data.settings).toEqual(JSON.parse(raw).settings);
    expect(data.meta).toMatchObject({ schema: 1, from: 'localStorage', count: 3 });
    expect(ls.getItem(LEGACY_LS_KEY)).toBe(raw);
  });
  it('ne migre qu’une fois : les modifications faites ensuite ne sont pas écrasées', async () => {
    const ls = fakeStorage({ [LEGACY_LS_KEY]: legacyJson() });
    await migrateFromLocalStorage(db, ls);
    await deleteProblem(db, 'p1');
    await putProblem(db, { id: 'p9', course: 'Algèbre' });
    expect(await migrateFromLocalStorage(db, ls)).toEqual({ status: 'already', count: 0 });
    expect((await loadCarnet(db)).problems.map(p => p.id).sort()).toEqual(['p2', 'p3', 'p9']);
  });
  it('installation neuve : rien à migrer', async () => {
    expect((await migrateFromLocalStorage(db, fakeStorage())).status).toBe('fresh');
    expect((await loadCarnet(db)).problems).toEqual([]);
  });
  it('ancien bloc illisible : rien n’est perdu, le texte brut est conservé', async () => {
    const ls = fakeStorage({ [LEGACY_LS_KEY]: '{"problems":{"p1":{"id":"p1","cou' });
    const r = await migrateFromLocalStorage(db, ls);
    expect(r.status).toBe('corrupt');
    expect(await kvGet(db, 'legacy-illisible')).toBe('{"problems":{"p1":{"id":"p1","cou');
    expect(ls.getItem(LEGACY_LS_KEY)).toBe('{"problems":{"p1":{"id":"p1","cou');
    expect((await loadCarnet(db)).meta.corrupt).toBe(true);
  });
  it('lit aussi un ancien problème sans champ id (la clé sert d’identifiant)', () => {
    const got = readLegacy(fakeStorage({ [LEGACY_LS_KEY]: legacyJson() }));
    expect(got.problems.find(p => p.course === 'Analyse').id).toBe('p3');
  });
});

describe('écritures du carnet', () => {
  it('enregistre, remplace et supprime un problème sans toucher aux autres', async () => {
    await putProblem(db, { id: 'a', n: 1 }); await putProblem(db, { id: 'b', n: 1 });
    await putProblem(db, { id: 'a', n: 2 });
    expect((await loadCarnet(db)).problems).toEqual([{ id: 'a', n: 2 }, { id: 'b', n: 1 }]);
    await deleteProblem(db, 'a');
    expect((await loadCarnet(db)).problems).toEqual([{ id: 'b', n: 1 }]);
  });
  it('enregistre les réglages', async () => {
    await putSettings(db, { dailyLimit: 7 });
    expect((await loadCarnet(db)).settings).toEqual({ dailyLimit: 7 });
  });
  it('writeCarnet est tout ou rien : un enregistrement invalide n’efface pas l’existant', async () => {
    await putProblem(db, { id: 'a', n: 1 });
    await expect(writeCarnet(db, { problems: [{ id: 'z' }, { sansId: true }], settings: {} })).rejects.toBeTruthy();
    expect((await loadCarnet(db)).problems).toEqual([{ id: 'a', n: 1 }]);
  });
  it('une transaction qui lève n’écrit rien', async () => {
    await putProblem(db, { id: 'a', n: 1 });
    await expect(tx(db, 'problems', 'readwrite', st => { st.put({ id: 'b' }); throw new Error('boum'); })).rejects.toThrow('boum');
    expect((await loadCarnet(db)).problems).toEqual([{ id: 'a', n: 1 }]);
  });
});

describe('générations de stockage', () => {
  it('nomme les bases selon la génération', () => {
    expect(dbName('replay-notes', '')).toBe('replay-notes');
    expect(dbName('replay-notes', 'g42')).toBe('replay-notes@g42');
  });
  it('bascule le pointeur en gardant la génération précédente', () => {
    expect(generation()).toBe('');
    setGeneration('g1');
    expect(generation()).toBe('g1'); expect(previousGeneration()).toBe('');
    expect(dbName('replay-carnet')).toBe('replay-carnet@g1');
    setGeneration('g2');
    expect(previousGeneration()).toBe('g1');
    expect(globalThis.localStorage.getItem(GEN_KEY)).toBe('g2');
  });
});
