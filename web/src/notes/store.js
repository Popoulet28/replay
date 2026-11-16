import { today, uid } from '../core/helpers.js';
import { dbName, openDb } from '../core/db.js';
import { S } from '../core/state.js';

/* =====================================================================
   Cours v2 — moteur d'encre, pages, PDF  (partie 1 : stockage + rendu)
   ===================================================================== */
export const NB = { db:null, nodes:new Map(), ready:false, loading:null, urls:new Map(), editor:null, clip:null };
export function nbOpen(){
  if(NB.db) return Promise.resolve(NB.db);
  return new Promise((res,rej)=>{ const r=indexedDB.open(dbName('replay-notes'),1);
    r.onupgradeneeded=()=>{ const d=r.result; d.createObjectStore('nodes',{keyPath:'id'}); d.createObjectStore('docs'); d.createObjectStore('blobs'); };
    r.onsuccess=()=>{ NB.db=r.result; res(NB.db); }; r.onerror=()=>rej(r.error); });
}
export function nbTx(store, mode, fn){
  return nbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(store,mode); const rq=fn(tx.objectStore(store)); let out;
    if(rq) rq.onsuccess=()=>{ out=rq.result; };
    tx.oncomplete=()=>res(out); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); }));
}
/* Ouvre la base des notes d'une autre génération (restauration d'une sauvegarde). */
export function nbOpenGen(gen){ return openDb(dbName('replay-notes',gen),1,d=>{ d.createObjectStore('nodes',{keyPath:'id'}); d.createObjectStore('docs'); d.createObjectStore('blobs'); }); }
export const nbGet=(s,k)=>nbTx(s,'readonly',st=>st.get(k));
export const nbPut=(s,v,k)=>nbTx(s,'readwrite',st=>k===undefined?st.put(v):st.put(v,k));
export const nbDel=(s,k)=>nbTx(s,'readwrite',st=>st.delete(k));
export const nbAll=s=>nbTx(s,'readonly',st=>st.getAll());
export const nbKeys=s=>nbTx(s,'readonly',st=>st.getAllKeys());
export const nbClear=s=>nbTx(s,'readwrite',st=>st.clear());
export function nbInit(){
  if(NB.ready) return Promise.resolve();
  if(!NB.loading) NB.loading=nbAll('nodes').then(list=>{ list.forEach(n=>NB.nodes.set(n.id,n)); }).catch(e=>console.warn('notes',e)).then(()=>{ NB.ready=true; });
  return NB.loading;
}
export async function nbBlobURL(key){
  if(!key) return null; if(NB.urls.has(key)) return NB.urls.get(key);
  const b=await nbGet('blobs',key); if(!b) return null;
  const u=URL.createObjectURL(b); NB.urls.set(key,u); return u;
}
export function nbForget(key){ const u=NB.urls.get(key); if(u){ URL.revokeObjectURL(u); NB.urls.delete(key); } }
export const nbIsRoot=p=>typeof p==='string' && p.startsWith('c:');
export function nbCourseOf(n){ let x=n, g=0; while(x && !nbIsRoot(x.parent) && g++<60) x=NB.nodes.get(x.parent); return x && nbIsRoot(x.parent) ? x.parent.slice(2) : null; }
export function nbSort(list){
  const by=S.settings.nbSort||'recent';
  return list.sort((a,b)=> (a.type===b.type?0:(a.type==='folder'?-1:1)) || (by==='name' ? a.name.localeCompare(b.name,'fr',{numeric:true}) : (b.updated||0)-(a.updated||0)));
}
export function nbChildren(parent){ return nbSort([...NB.nodes.values()].filter(n=>n.parent===parent)); }
export function nbDescendantIds(id){ const out=[]; const walk=p=>{ for(const c of nbChildren(p)){ out.push(c.id); if(c.type==='folder') walk(c.id); } }; walk(id); return out; }
export async function nbSaveNode(n, keepDate){ if(!keepDate) n.updated=Date.now(); NB.nodes.set(n.id,n); await nbPut('nodes',n); }
export async function nbCreate(type, parent, name, extra){
  const n=Object.assign({id:(type==='folder'?'f':'n')+uid().slice(1), type, parent, name, created:today(), createdAt:Date.now(), updated:Date.now(), stamps:[]}, extra||{});
  await nbSaveNode(n); return n;
}
export function docBlobKeys(d){
  const keys=new Set();
  for(const it of (d&&d.items)||[]) for(const k of ['img','lo','blob','pdf']) if(it[k]) keys.add(it[k]);
  return keys;
}
export async function nbDeleteNode(id){
  const n=NB.nodes.get(id); if(!n) return;
  for(const c of nbChildren(id)) await nbDeleteNode(c.id);
  if(n.type==='note'){
    const d=await nbGet('docs',id);
    for(const k of docBlobKeys(d)){ await nbDel('blobs',k); nbForget(k); }
    if(n.thumb){ await nbDel('blobs',n.thumb); nbForget(n.thumb); }
    await nbDel('docs',id);
  }
  NB.nodes.delete(id); await nbDel('nodes',id);
}
export function nbNoteCount(course){ let n=0; for(const x of NB.nodes.values()) if(x.type==='note' && nbCourseOf(x)===course) n++; return n; }
export function nbStampsOf(course, type){
  const out=[];
  for(const n of NB.nodes.values()) if(n.type==='note' && nbCourseOf(n)===course)
    for(const s of (n.stamps||[])) if(s.t===type) out.push({node:n, s});
  return out.sort((a,b)=>(b.node.updated||0)-(a.node.updated||0));
}
export async function putBlob(blob, prefix){ const key=(prefix||'b:')+uid(); await nbPut('blobs',blob,key); return key; }

