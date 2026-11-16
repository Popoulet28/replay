/* Accès IndexedDB (promesses) et « génération » de stockage.

   Toutes les bases de l'appli portent le suffixe de la génération courante :
     génération ''        -> replay-carnet, replay-images, replay-notes   (bases d'origine)
     génération 'g123'    -> replay-carnet@g123, replay-images@g123, replay-notes@g123
   Restaurer une sauvegarde écrit dans une NOUVELLE génération, la vérifie, puis change ce seul
   pointeur : tant que la bascule n'a pas eu lieu, les données en place ne sont jamais touchées. */

export const GEN_KEY = 'replay-generation';
export const PREV_GEN_KEY = 'replay-generation-previous';
export const DB_BASES = ['replay-carnet', 'replay-images', 'replay-notes'];

let memGen = null; // utilisé si localStorage est indisponible
export function generation(){
  if (memGen !== null) return memGen;
  try { return localStorage.getItem(GEN_KEY) || ''; } catch (e) { return ''; }
}
export function setGeneration(gen){
  try {
    const prev = localStorage.getItem(GEN_KEY) || '';
    localStorage.setItem(PREV_GEN_KEY, prev);
    localStorage.setItem(GEN_KEY, gen);
    if ((localStorage.getItem(GEN_KEY) || '') !== gen) throw new Error('pointeur non écrit');
  } catch (e) { memGen = gen; throw e; }
}
export function previousGeneration(){
  try { const v = localStorage.getItem(PREV_GEN_KEY); return v === null ? null : v; } catch (e) { return null; }
}
export function forgetPreviousGeneration(){ try { localStorage.removeItem(PREV_GEN_KEY); } catch (e) {} }
export function dbName(base, gen){
  const g = gen === undefined ? generation() : gen;
  return g ? base + '@' + g : base;
}

export function openDb(name, version, upgrade){
  return new Promise((res, rej) => {
    const r = indexedDB.open(name, version);
    r.onupgradeneeded = e => upgrade(r.result, e.oldVersion, r.transaction);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('base verrouillée : ' + name));
  });
}
export function deleteDb(name){
  return new Promise(res => {
    const r = indexedDB.deleteDatabase(name);
    r.onsuccess = () => res(true); r.onerror = () => res(false); r.onblocked = () => res(false);
  });
}
/* Exécute fn(store…) dans une transaction ; la promesse n'est tenue qu'une fois la transaction VALIDÉE. */
export function tx(db, stores, mode, fn){
  return new Promise((res, rej) => {
    let t; try { t = db.transaction(stores, mode); } catch (e) { rej(e); return; }
    const list = (Array.isArray(stores) ? stores : [stores]).map(s => t.objectStore(s));
    let out;
    try {
      const r = fn(...list);
      if (r && typeof r === 'object' && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
      else out = r;
    } catch (e) { try { t.abort(); } catch (_) {} rej(e); return; }
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('transaction annulée'));
  });
}
