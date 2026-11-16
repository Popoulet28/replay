import { initAI } from '../ai/claude.js';
import { DEFAULT_SETTINGS, fixCourse } from './data.js';
import { clone } from './helpers.js';
import { S, topicsOf } from './state.js';
import { dbName, openDb, tx } from './db.js';
import { deleteProblem, loadCarnet, migrateFromLocalStorage, openCarnet, putProblem, putSettings, readLegacy, writeCarnet } from './carnet.js';
import { cleanupGenerations, maybeAutoBackup, restoredNotice } from './backup.js';
import { nbInit } from '../notes/store.js';
import { go, refresh, render, toast } from '../ui/chrome.js';

/* ---------- storage ---------- */
let CARNET = null; // base IndexedDB du carnet (null en mode « mémoire »)
export const carnetDb = () => CARNET;

export function normalizeProblem(v){ v.course=fixCourse(v.course); v.topics=topicsOf(v); return v; }
export function applyCarnet(data){
  S.settings = Object.assign(clone(DEFAULT_SETTINGS), data.settings||{});
  (S.settings.exams||[]).forEach(e=>{ e.course=fixCourse(e.course); });
  S.problems = new Map((data.problems||[]).map(p=>[p.id, normalizeProblem(p)]));
}

export async function init(){
  render();
  document.getElementById('gear').addEventListener('click',()=>go('settings'));
  initAI();
  const notesReady=nbInit().then(()=>refresh());
  // Demande au système de ne jamais purger le stockage de l'appli (sans effet si déjà accordé).
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{}); }catch(e){}
  restoredNotice();
  await startLocal();
  cleanupGenerations();
  // sauvegarde automatique : une fois tout chargé, sans gêner le démarrage
  notesReady.then(()=>setTimeout(maybeAutoBackup, 5000));
}

export async function startLocal(){
  try{
    CARNET = await openCarnet();
    const mig = await migrateFromLocalStorage(CARNET, localStorage);
    applyCarnet(await loadCarnet(CARNET));
    S.mode='local';
    if (mig.status==='corrupt') S.notice={kind:'err', text:'L’ancien carnet enregistré sur cet appareil était illisible. Rien n’a été effacé : son contenu brut est conservé. Restaure ta dernière sauvegarde (Réglages → Restaurer une sauvegarde).'};
  }catch(e){
    console.warn('carnet', e);
    // La base est inaccessible : on montre quand même l'ancien carnet s'il existe, sans rien écrire.
    CARNET=null; S.mode='memory';
    try{ const legacy=readLegacy(localStorage); if(legacy) applyCarnet(legacy); }catch(_){}
    S.notice={kind:'err', text:'Le stockage de l’appli est inaccessible (plein ou bloqué) : rien de ce que tu fais maintenant ne sera enregistré. Libère de la place puis relance l’appli.'};
  }
  S.loaded = true; render();
}

function saveFail(e){
  console.warn('enregistrement', e);
  const full = e && (e.name==='QuotaExceededError' || /quota/i.test(String(e.message||'')));
  toast(full ? 'Stockage plein : la modification n’a pas pu être enregistrée. Libère de la place.' : 'Enregistrement impossible sur cet appareil.','err');
  return false;
}
export async function saveSettings(){
  if (!CARNET) return S.mode==='memory';
  return putSettings(CARNET, clone(S.settings)).then(()=>true, saveFail);
}
export async function saveProblem(p){
  S.problems.set(p.id, p);
  if (!CARNET) return S.mode==='memory';
  return putProblem(CARNET, clone(p)).then(()=>true, saveFail);
}
export async function removeProblem(p){
  S.problems.delete(p.id);
  for (const k of ['problemImg','solutionImg','noteImg']) if (p[k] && p[k].startsWith('idb:')){ idbDel(p[k]); const u=IMG_URLS.get(p[k]); if(u) URL.revokeObjectURL(u); IMG_URLS.delete(p[k]); }
  if (!CARNET) return S.mode==='memory';
  return deleteProblem(CARNET, p.id).then(()=>true, saveFail);
}
/* Réécrit tout le carnet d'un coup (une transaction : tout ou rien). */
export async function persistAll(meta){
  if (!CARNET) return S.mode==='memory';
  return writeCarnet(CARNET, {problems:[...S.problems.values()].map(clone), settings:clone(S.settings)}, meta).then(()=>true, saveFail);
}

/* ---------- images du carnet (base « replay-images ») ---------- */
export const IMG_URLS=new Map(); // référence -> URL d'objet, remplie à la demande
let IMG_DB=null;
export function idbOpen(){ if(!IMG_DB) IMG_DB=openDb(dbName('replay-images'),1,db=>{ db.createObjectStore('img'); }); return IMG_DB; }
export async function idbPut(key,blob){ return tx(await idbOpen(),'img','readwrite',st=>{ st.put(blob,key); }); }
export async function idbGet(key){ return tx(await idbOpen(),'img','readonly',st=>st.get(key)); }
export async function idbKeys(){ return tx(await idbOpen(),'img','readonly',st=>st.getAllKeys()); }
export async function idbDel(key){ try{ await tx(await idbOpen(),'img','readwrite',st=>{ st.delete(key); }); }catch(e){ console.warn('idb del',e); } }
