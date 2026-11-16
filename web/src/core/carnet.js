/* Carnet d'erreurs : un enregistrement IndexedDB par problème (plus de gros bloc localStorage).
   Base « replay-carnet » : magasin « problems » (clé = id) et magasin « kv » (settings, meta…). */
import { dbName, openDb, tx } from './db.js';

export const CARNET_SCHEMA = 1;
export const LEGACY_LS_KEY = 'replay-notebook-v1';

export function openCarnet(gen){
  return openDb(dbName('replay-carnet', gen), 1, db => {
    db.createObjectStore('problems', { keyPath: 'id' });
    db.createObjectStore('kv');
  });
}
export const kvGet = (db, key) => tx(db, 'kv', 'readonly', kv => kv.get(key));
export const kvPut = (db, key, value) => tx(db, 'kv', 'readwrite', kv => { kv.put(value, key); });
export const putProblem = (db, p) => tx(db, 'problems', 'readwrite', st => { st.put(p); });
export const deleteProblem = (db, id) => tx(db, 'problems', 'readwrite', st => { st.delete(id); });
export const putSettings = (db, settings) => kvPut(db, 'settings', settings);

export async function loadCarnet(db){
  const [problems, settings, meta] = await Promise.all([
    tx(db, 'problems', 'readonly', st => st.getAll()), kvGet(db, 'settings'), kvGet(db, 'meta'),
  ]);
  return { problems: problems || [], settings: settings || null, meta: meta || null };
}
/* Écrit tout un carnet d'un coup (une seule transaction : tout ou rien). */
export function writeCarnet(db, { problems, settings }, meta){
  return tx(db, ['problems', 'kv'], 'readwrite', (st, kv) => {
    st.clear();
    for (const p of problems) st.put(p);
    kv.put(settings || {}, 'settings');
    kv.put(Object.assign({ schema: CARNET_SCHEMA, at: Date.now() }, meta || {}), 'meta');
  });
}

/* Lit l'ancien format (localStorage). Renvoie {problems, settings}, null s'il n'y a rien, ou lève si illisible. */
export function readLegacy(storage){
  const raw = storage.getItem(LEGACY_LS_KEY);
  if (raw == null || raw === '') return null;
  const o = JSON.parse(raw);
  if (!o || typeof o !== 'object') throw new Error('format inattendu');
  const problems = Object.entries(o.problems || {})
    .filter(([, v]) => v && typeof v === 'object')
    .map(([k, v]) => Object.assign({}, v, { id: v.id || k }));
  return { problems, settings: o.settings || {} };
}

/* Première ouverture après la mise à jour : copie l'ancien carnet (localStorage) dans la base.
   L'ancien bloc n'est NI modifié NI supprimé : il reste comme copie de secours.
   Résultat : 'already' (déjà fait), 'fresh' (rien à migrer), 'migrated', ou 'corrupt' (ancien bloc illisible). */
export async function migrateFromLocalStorage(db, storage){
  const meta = await kvGet(db, 'meta');
  if (meta) return { status: 'already', count: 0 };
  let legacy;
  try { legacy = readLegacy(storage); }
  catch (e) {
    let raw = null; try { raw = storage.getItem(LEGACY_LS_KEY); } catch (_) {}
    await tx(db, 'kv', 'readwrite', kv => {
      kv.put(raw, 'legacy-illisible');
      kv.put({ schema: CARNET_SCHEMA, at: Date.now(), from: 'localStorage', corrupt: true }, 'meta');
    });
    return { status: 'corrupt', count: 0 };
  }
  if (!legacy) { await kvPut(db, 'meta', { schema: CARNET_SCHEMA, at: Date.now(), from: 'new' }); return { status: 'fresh', count: 0 }; }
  await writeCarnet(db, legacy, { from: 'localStorage', count: legacy.problems.length });
  const n = await tx(db, 'problems', 'readonly', st => st.count());
  if (n !== legacy.problems.length) {
    await tx(db, ['problems', 'kv'], 'readwrite', (st, kv) => { st.clear(); kv.delete('meta'); kv.delete('settings'); });
    throw new Error('migration incomplète : ' + n + ' sur ' + legacy.problems.length);
  }
  return { status: 'migrated', count: n };
}
