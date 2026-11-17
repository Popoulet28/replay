/* Ramasse-miettes : supprime les fichiers (photos, pages PDF, vignettes) que plus rien ne référence.
   Prudence : on ne touche jamais à un fichier créé depuis moins d'un jour (il peut être en cours
   d'enregistrement ou récupérable par « annuler ») ni à ce qui est dans le presse-papiers. */
import { imageRefs } from './backup-format.js';
import { GC_MIN_AGE, findOrphans } from './gc-keys.js';
import { S } from './state.js';
import { idbDel, idbKeys } from './storage.js';
import { NB, docBlobKeys, nbAll, nbDel, nbForget, nbGet, nbInit, nbKeys } from '../notes/store.js';

const LAST_KEY = 'replay-last-gc';

export async function collectGarbage(opts){
  const now = (opts && opts.now) || Date.now();
  const out = { images: 0, blobs: 0 };
  if (NB.editor || S.mode !== 'local' || !S.loaded) return out;
  await nbInit();
  // 1. fichiers des notes
  const ref = new Set();
  for (const n of await nbAll('nodes')) {
    if (n.thumb) ref.add(n.thumb);
    if (n.type !== 'note') continue;
    const d = await nbGet('docs', n.id);
    for (const k of docBlobKeys(d)) ref.add(k);
  }
  if (NB.clip) for (const it of NB.clip.items || []) for (const f of ['img', 'lo', 'blob', 'pdf']) if (it[f]) ref.add(it[f]);
  for (const k of findOrphans(await nbKeys('blobs'), ref, now)) {
    if (NB.editor) return out; // une note vient d'être ouverte : on s'arrête là
    await nbDel('blobs', k); nbForget(k); out.blobs++;
  }
  // 2. photos du carnet
  const used = imageRefs(S.problems.values());
  for (const k of findOrphans(await idbKeys(), used, now)) { await idbDel(k); out.images++; }
  return out;
}
/* Au plus une fois par jour, quelques secondes après le démarrage. */
export function scheduleGarbageCollection(){
  let last = 0; try { last = Number(localStorage.getItem(LAST_KEY)) || 0; } catch (e) {}
  if (Date.now() - last < GC_MIN_AGE) return;
  setTimeout(async () => {
    try { const r = await collectGarbage(); if (!NB.editor) { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} } if (r.images || r.blobs) console.info('Nettoyage :', r); }
    catch (e) { console.warn('gc', e); }
  }, 20000);
}
