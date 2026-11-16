import { el, uid } from './helpers.js';
import { S } from './state.js';
import { IMG_URLS, idbGet, idbPut } from './storage.js';

/* ---------- images ---------- */
export function loadImage(blob){
  return new Promise((res,rej)=>{ const u=URL.createObjectURL(blob); const i=new Image();
    i.onload=()=>{ URL.revokeObjectURL(u); res(i); }; i.onerror=e=>{ URL.revokeObjectURL(u); rej(e); }; i.src=u; });
}
export async function recompress(blob, max, q, type){
  const img = await loadImage(blob);
  let w=img.naturalWidth, h=img.naturalHeight; const sc=Math.min(1, max/Math.max(w,h));
  w=Math.max(1,Math.round(w*sc)); h=Math.max(1,Math.round(h*sc));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(img,0,0,w,h);
  return await new Promise(r=>c.toBlob(r, type||'image/jpeg', q));
}
export function blobToDataURL(b){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b); }); }
export async function storeImage(blob){
  if (!blob) return null;
  if (S.mode==='local'){ try{ const key='idb:'+uid(); await idbPut(key, blob); IMG_URLS.set(key, URL.createObjectURL(blob)); return key; }catch(e){ console.warn('idb put',e); } }
  const small = await recompress(blob, 1000, 0.62, 'image/jpeg');
  return await blobToDataURL(small);
}
/* Adresse d'une image déjà chargée (ou '' si elle ne l'est pas encore : voir imgUrl). */
export const imgSrc = ref => ref ? (ref.startsWith('data:') ? ref : (IMG_URLS.get(ref)||'')) : null;
/* Charge une image à la demande : rien n'est lu au démarrage de l'appli. */
const IMG_PENDING=new Map();
export function imgUrl(ref){
  if(!ref) return Promise.resolve(null);
  const now=imgSrc(ref); if(now) return Promise.resolve(now);
  if(!IMG_PENDING.has(ref)) IMG_PENDING.set(ref, idbGet(ref).then(b=>{ if(!b) return null; const u=URL.createObjectURL(b); IMG_URLS.set(ref,u); return u; }).catch(()=>null).finally(()=>IMG_PENDING.delete(ref)));
  return IMG_PENDING.get(ref);
}
export function imgBlob(ref){
  if(!ref) return Promise.resolve(null);
  if(ref.startsWith('data:')) return fetch(ref).then(r=>r.blob()).catch(()=>null);
  return idbGet(ref).catch(()=>null);
}
/* <img> dont la source arrive dès que l'image est lue. props.ref = référence de l'image. */
export function imgEl(props){
  const {ref, ...rest}=props; const img=el('img',rest);
  if(ref){ const now=imgSrc(ref); if(now) img.src=now; else imgUrl(ref).then(u=>{ if(u) img.src=u; }); }
  return img;
}
