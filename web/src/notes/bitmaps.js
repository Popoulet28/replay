import { nbGet, putBlob } from './store.js';

/* ---------------- images : bitmaps décodés, cache LRU ---------------- */
export const BMP={map:new Map(), px:0, LIMIT:42e6};
export function bmpEvict(){ for(const [k,e] of BMP.map){ if(BMP.px<=BMP.LIMIT) break; if(!e.bmp) continue; BMP.map.delete(k); BMP.px-=e.px; try{ e.bmp.close(); }catch(_){} } }
export function bmpLoad(key){
  let e=BMP.map.get(key);
  if(e){ BMP.map.delete(key); BMP.map.set(key,e); return e.p; }
  e={bmp:null, px:0, p:null}; BMP.map.set(key,e);
  e.p=nbGet('blobs',key).then(b=>b?createImageBitmap(b):null).catch(()=>null).then(bmp=>{ e.bmp=bmp; if(bmp){ e.px=bmp.width*bmp.height; BMP.px+=e.px; bmpEvict(); } return bmp; });
  return e.p;
}
export function bmpNow(key, onReady){
  if(!key) return null; const e=BMP.map.get(key);
  if(e && e.bmp){ BMP.map.delete(key); BMP.map.set(key,e); return e.bmp; }
  bmpLoad(key).then(b=>{ if(b && onReady) onReady(); }); return null;
}
/* version basse résolution (vignettes, dézoom) générée une fois */
export const LO_PENDING=new Set();
export function ensureLo(it, onDone){
  if(it.lo || LO_PENDING.has(it.id)) return; const src=it.img||it.blob; if(!src) return; LO_PENDING.add(it.id);
  (async()=>{ const b=await nbGet('blobs',src); if(!b) return; const bmp=await createImageBitmap(b);
    const w=Math.min(520,bmp.width), h=Math.round(bmp.height*w/bmp.width); const c=document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(bmp,0,0,w,h); bmp.close();
    const lb=await new Promise(r=>c.toBlob(r,'image/jpeg',0.82)); it.lo=await putBlob(lb,'lo:'); onDone&&onDone(); })().catch(e=>console.warn('lo',e)).finally(()=>LO_PENDING.delete(it.id));
}

