import { el, uid } from '../core/helpers.js';
import { ruler } from '../game/game.js';
import { nbGet, putBlob } from './store.js';
import { modal, toast } from '../ui/chrome.js';

/* ---------------- PDF ---------------- */
export let PDFJS=null;
export async function loadModuleLib(path){ const src=await (await fetch(path)).text(); return import(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); }
export async function loadPdfJs(){
  if(PDFJS) return PDFJS;
  const mod=await loadModuleLib('lib/pdf.min.mjs');
  const wsrc=await (await fetch('lib/pdf.worker.min.mjs')).text();
  mod.GlobalWorkerOptions.workerPort=new Worker(URL.createObjectURL(new Blob([wsrc],{type:'text/javascript'})),{type:'module'});
  PDFJS=mod; return mod;
}
export const LIBS={};
export function loadScriptLib(path, global){
  if(LIBS[path]) return LIBS[path];
  LIBS[path]=fetch(path).then(r=>r.text()).then(src=>new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=URL.createObjectURL(new Blob([src],{type:'text/javascript'})); s.onload=()=>res(window[global]); s.onerror=rej; document.head.append(s); }));
  return LIBS[path];
}
export const PDFDOCS=new Map();
export function pdfDocFor(key){
  if(!PDFDOCS.has(key)) PDFDOCS.set(key,(async()=>{ const pdfjs=await loadPdfJs(); const b=await nbGet('blobs',key); return pdfjs.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise; })());
  return PDFDOCS.get(key);
}
export async function pdfRenderCanvas(pdf, index, width){
  const page=await pdf.getPage(index); const v1=page.getViewport({scale:1}); const vp=page.getViewport({scale:width/v1.width});
  const c=document.createElement('canvas'); c.width=Math.round(vp.width); c.height=Math.round(vp.height);
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  await page.render({canvasContext:x, viewport:vp}).promise; page.cleanup(); return c;
}
/* pages nettes au zoom : rendu vectoriel à la demande */
export const HIRES={map:new Map(), busy:false, queue:[]};
export function hiresNow(it, wantPx, onReady){
  const k=it.pdf+'#'+it.pi; const e=HIRES.map.get(k);
  if(e && e.bmp && e.w>=wantPx*0.85){ HIRES.map.delete(k); HIRES.map.set(k,e); return e.bmp; }
  if(!HIRES.queue.find(q=>q.k===k)){ HIRES.queue.push({k, it, w:Math.min(4200,Math.round(wantPx*1.1)), onReady}); pumpHires(); }
  return e && e.bmp ? e.bmp : null;
}
export async function pumpHires(){
  if(HIRES.busy) return; const job=HIRES.queue.pop(); HIRES.queue.length=0; if(!job) return; HIRES.busy=true;
  try{ const pdf=await pdfDocFor(job.it.pdf); const c=await pdfRenderCanvas(pdf, job.it.pi, job.w); const bmp=await createImageBitmap(c);
    const old=HIRES.map.get(job.k); if(old&&old.bmp) old.bmp.close();
    HIRES.map.set(job.k,{bmp, w:c.width}); while(HIRES.map.size>4){ const [k0,e0]=HIRES.map.entries().next().value; HIRES.map.delete(k0); e0.bmp&&e0.bmp.close(); }
    job.onReady&&job.onReady(); }
  catch(e){ console.warn('hires',e); }
  HIRES.busy=false; if(HIRES.queue.length) pumpHires();
}
export function progressBox(text){
  const label=el('div',{class:'res-big',text}); const bar=ruler(0);
  const close=modal(el('div',{}, label, el('div',{style:{marginTop:'12px'}},bar)));
  return {set:(t,f)=>{ label.textContent=t; bar.querySelector('i').style.width=Math.round(f*100)+'%'; }, close};
}
/* importe un PDF en pages ; renvoie les nouvelles pages (sans position) */
export async function pdfToPages(file){
  const pb=progressBox('Lecture du PDF…');
  try{
    const pdfjs=await loadPdfJs();
    const pdfKey=await putBlob(file,'pdf:');
    const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=[];
    for(let i=1;i<=pdf.numPages;i++){
      const c=await pdfRenderCanvas(pdf,i,1600);
      const mid=await new Promise(r=>c.toBlob(r,'image/jpeg',0.86));
      const lw=Math.min(520,c.width), lh=Math.round(c.height*lw/c.width); const lc=document.createElement('canvas'); lc.width=lw; lc.height=lh; lc.getContext('2d').drawImage(c,0,0,lw,lh);
      const lo=await new Promise(r=>lc.toBlob(r,'image/jpeg',0.8));
      pages.push({id:uid(), kind:'page', w:1000, h:Math.round(1000*c.height/c.width), img:await putBlob(mid), lo:await putBlob(lo,'lo:'), pdf:pdfKey, pi:i, tpl:'blank'});
      pb.set('Import : page '+i+' sur '+pdf.numPages, i/pdf.numPages);
    }
    pdf.destroy&&pdf.destroy(); pb.close(); return pages;
  }catch(e){ pb.close(); console.warn(e); toast('Impossible de lire ce PDF.','err'); return []; }
}

