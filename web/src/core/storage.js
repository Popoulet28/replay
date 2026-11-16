import { initAI } from '../ai/claude.js';
import { DEFAULT_SETTINGS, LS_KEY, fixCourse } from './data.js';
import { clone, sleep } from './helpers.js';
import { S, topicsOf } from './state.js';
import { nbInit } from '../notes/store.js';
import { go, refresh, render, toast } from '../ui/chrome.js';

/* ---------- storage ---------- */
export async function init(){
  render();
  document.getElementById('gear').addEventListener('click',()=>go('settings'));
  initAI();
  nbInit().then(()=>refresh());
  const api = (window.claude && typeof window.claude.use==='function') ? window.claude : null;
  if (api){
    try{
      const [db,user,assets] = await Promise.all([
        api.use('db'), api.use('user'), api.use('assets').catch(()=>null)
      ]);
      const id = user ? await user.id() : null;
      if (db && id){ startCloud(db, id, assets); return; }
    }catch(e){ console.warn('capabilities', e); }
  }
  startLocal();
}
export function startCloud(db, id, assets){
  S.mode='cloud'; S.db=db; S.uid=id; S.assets=assets;
  S.settingsRef = db.doc('data/users/'+id+'/settings');
  S.col = S.settingsRef.collection('problems');
  let hadS=false, hadP=false, okS=false, okP=false;
  const timer = setTimeout(()=>{ if(!(okS&&okP)){ S.stale=true; S.loaded=true; refresh(); } }, 10000);
  const after = ()=>{
    if (hadS && hadP) S.loaded = true;
    if (okS && okP){ clearTimeout(timer); S.stale=false; }
    refresh();
  };
  S.settingsRef.onSnapshot(snap=>{
    if (snap.exists){ S.settings = Object.assign(clone(DEFAULT_SETTINGS), clone(snap.data())); (S.settings.exams||[]).forEach(e=>e.course=fixCourse(e.course)); }
    hadS = true; if(!snap.metadata.fromCache) okS = true; after();
  }, err=>{ console.warn(err); hadS=okS=true; after(); });
  S.col.onSnapshot(snap=>{
    const m = new Map();
    snap.docs.forEach(d=>{ if(d.exists) { const o=Object.assign(clone(d.data()), {id:d.id}); o.course=fixCourse(o.course); o.topics=topicsOf(o); m.set(d.id,o); } });
    S.problems = m; hadP = true; if(!snap.metadata.fromCache) okP = true; after();
  }, err=>{ console.warn(err); hadP=okP=true; toast('Impossible de charger tes problèmes ('+(err&&err.code||'error')+').','err'); after(); });
}
export const IMG_URLS=new Map();
export function idbOpen(){ return new Promise((res,rej)=>{ const r=indexedDB.open('replay-images',1); r.onupgradeneeded=()=>r.result.createObjectStore('img'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
export async function idbPut(key,blob){ const db=await idbOpen(); return new Promise((res,rej)=>{ const tx=db.transaction('img','readwrite'); tx.objectStore('img').put(blob,key); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
export async function idbDel(key){ const db=await idbOpen(); return new Promise(res=>{ const tx=db.transaction('img','readwrite'); tx.objectStore('img').delete(key); tx.oncomplete=()=>res(); tx.onerror=()=>res(); }); }
export async function idbAll(){ const db=await idbOpen(); return new Promise((res,rej)=>{ const out=[]; const rq=db.transaction('img').objectStore('img').openCursor(); rq.onsuccess=()=>{ const c=rq.result; if(c){ out.push([c.key,c.value]); c.continue(); } else res(out); }; rq.onerror=()=>rej(rq.error); }); }
export async function startLocal(){
  try{ for(const [k,b] of await idbAll()) IMG_URLS.set(k, URL.createObjectURL(b)); }catch(e){ console.warn('idb',e); }
  S.mode='local';
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (raw){ const o = JSON.parse(raw);
      S.settings = Object.assign(clone(DEFAULT_SETTINGS), o.settings||{});
      S.problems = new Map(Object.entries(o.problems||{}).map(([k,v])=>{ v.course=fixCourse(v.course); v.topics=topicsOf(v); return [k,v]; })); }
  }catch(e){ S.mode='memory'; }
  S.loaded = true; render();
}
export function persistLocal(){
  if (S.mode!=='local') return S.mode==='memory';
  try{ localStorage.setItem(LS_KEY, JSON.stringify({settings:S.settings, problems:Object.fromEntries(S.problems)})); return true; }
  catch(e){ toast('Impossible d’enregistrer sur cet appareil (stockage plein ou bloqué).','err'); return false; }
}
export const chains = {};
export function queued(key, fn){
  const run = async ()=>{ try{ return await fn(); }catch(e){ if(e && e.code==='unavailable'){ await sleep(400+Math.random()*600); return fn(); } throw e; } };
  const next = (chains[key]||Promise.resolve()).catch(()=>{}).then(run);
  chains[key] = next; return next;
}
export function dbFail(e){
  const c = e && e.code;
  if (c==='quota_exceeded') toast('Stockage plein — supprime ou archive quelques anciens problèmes.','err');
  else if (c==='invalid_argument') toast('Ce problème est trop lourd (essaie une photo plus petite).','err');
  else toast('Enregistrement impossible pour le moment ('+(c||'erreur')+'). Vérifie ta connexion.','err');
  return false;
}
export async function saveSettings(){
  if (S.mode==='cloud'){ const data = clone(S.settings); return queued('settings', ()=>S.settingsRef.set(data)).then(()=>true, dbFail); }
  return persistLocal();
}
export async function saveProblem(p){
  S.problems.set(p.id, p);
  if (S.mode==='cloud'){ const data = clone(p); return queued(p.id, ()=>S.col.doc(p.id).set(data)).then(()=>true, dbFail); }
  return persistLocal();
}
export async function removeProblem(p){
  S.problems.delete(p.id);
  if (S.mode==='cloud'){
    const ok = await queued(p.id, ()=>S.col.doc(p.id).delete()).then(()=>true, dbFail);
    if (ok && S.assets) for (const k of ['problemImg','solutionImg','noteImg'])
      if (p[k] && !p[k].startsWith('data:')) S.assets.delete(p[k]).catch(()=>{});
    return ok;
  }
  for (const k of ['problemImg','solutionImg','noteImg']) if (p[k] && p[k].startsWith('idb:')){ idbDel(p[k]); IMG_URLS.delete(p[k]); }
  return persistLocal();
}

