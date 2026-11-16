import { sleep, uid } from './helpers.js';
import { S } from './state.js';
import { IMG_URLS, idbPut } from './storage.js';

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
  if (S.mode==='cloud' && S.assets){
    for (let a=0;a<2;a++){
      try{ const r = await S.assets.upload(blob, {type: blob.type || 'image/jpeg'}); return r.id; }
      catch(e){ console.warn('upload', e); if(!(e && e.code==='store_unavailable') || a) break; await sleep(800); }
    }
  }
  if (S.mode==='local'){ try{ const key='idb:'+uid(); await idbPut(key, blob); IMG_URLS.set(key, URL.createObjectURL(blob)); return key; }catch(e){ console.warn('idb put',e); } }
  const small = await recompress(blob, S.mode==='cloud'?1100:1000, 0.62, 'image/jpeg');
  return await blobToDataURL(small);
}
export const imgSrc = ref => ref ? (ref.startsWith('data:') ? ref : ref.startsWith('idb:') ? (IMG_URLS.get(ref)||'') : '/_blob/'+ref) : null;

