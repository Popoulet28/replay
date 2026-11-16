import { clone, el, parseYmd, today, uid } from '../core/helpers.js';
import { hasNativeFiles, saveBlob } from '../core/save-file.js';
import { normalizeDoc } from './editor.js';
import { unionBox } from './objects.js';
import { loadScriptLib, progressBox } from './pdf.js';
import { renderRegion } from './scene.js';
import { docBlobKeys, nbCreate, nbGet, nbPut, nbSaveNode, putBlob } from './store.js';
import { modal, toast } from '../ui/chrome.js';

/* =====================================================================
   Cours v2 — fichiers, export, sauvegarde (partie 3)
   ===================================================================== */
export function promptBox(label, value){
  return new Promise(res=>{ let close; const inp=el('input',{type:'text',value:value||''});
    const done=v=>{ close(); res(v); };
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') done(inp.value.trim()||null); });
    close=modal(el('div',{}, el('h3',{text:label}), inp, el('div',{class:'row',style:{marginTop:'14px'}}, el('span',{class:'spacer'}),
      el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>done(null)}),
      el('button',{class:'btn primary',type:'button',text:'OK',onclick:()=>done(inp.value.trim()||null)}))));
    setTimeout(()=>{ inp.focus(); inp.select(); },60); });
}
export const safeName=n=>String(n||'note').replace(/[\\/:*?"<>|]+/g,'-').slice(0,80);
export function dateName(){ return 'Cours du '+parseYmd(today()).toLocaleDateString('fr-CH',{day:'numeric',month:'long'}); }
export const COVERS=['#1d2fa0','#d3302f','#1d8a4e','#7a3fc4','#e07020','#0e8a9c','#16182a','#c98a00'];
export async function saveBinary(name, mime, bytes){
  const ok=await saveBlob(name, mime, new Blob([bytes],{type:mime}));
  if(hasNativeFiles()) toast(ok?'Enregistré dans Téléchargements : '+name:'Enregistrement impossible.', ok?'':'err');
  return ok;
}
export async function exportNotePdf(node){
  const pb=progressBox('Préparation du PDF…');
  try{
    const PDFLib=await loadScriptLib('lib/pdf-lib.min.js','PDFLib');
    const d=normalizeDoc(await nbGet('docs',node.id)); const out=await PDFLib.PDFDocument.create();
    let rects=[];
    if(d.mode==='pages') rects=d.items.filter(i=>i.kind==='page').sort((a,b)=>a.y-b.y).map(p=>({x:p.x,y:p.y,w:p.w,h:p.h}));
    else { const b=unionBox(d.strokes,d.items); if(b){ const pad=40, w=b.w+2*pad, ph=w*1.414; for(let y=b.y-pad;y<b.y+b.h+pad;y+=ph) rects.push({x:b.x-pad,y,w,h:ph}); } }
    if(!rects.length){ pb.close(); toast('Cette note est vide.','err'); return; }
    for(let i=0;i<rects.length;i++){
      const r=rects[i]; const blob=await renderRegion(d,r,1600,{noStamps:true,q:0.9,bg:'#ffffff'});
      const jpg=await out.embedJpg(new Uint8Array(await blob.arrayBuffer())); const pw=595.28, ph=pw*r.h/r.w;
      out.addPage([pw,ph]).drawImage(jpg,{x:0,y:0,width:pw,height:ph}); pb.set('Page '+(i+1)+' sur '+rects.length,(i+1)/rects.length);
    }
    out.setTitle(node.name); const bytes=await out.save(); pb.close();
    await saveBinary(safeName(node.name)+'.pdf','application/pdf',bytes);
  }catch(e){ pb.close(); console.warn(e); toast('Export impossible.','err'); }
}
export async function duplicateNote(n){
  const d=await nbGet('docs',n.id)||{}; const map=new Map();
  for(const k of docBlobKeys(d)){ const b=await nbGet('blobs',k); if(b){ const nk=k.split(':')[0]+':'+uid(); await nbPut('blobs',b,nk); map.set(k,nk); } }
  const nd=clone(d); for(const it of (nd.items||[])) for(const f of ['img','lo','blob','pdf']) if(it[f]&&map.has(it[f])) it[f]=map.get(it[f]);
  const copy=await nbCreate('note',n.parent,n.name+' (copie)',{mode:n.mode, cover:n.cover, stamps:clone(n.stamps||[]), pages:n.pages});
  await nbPut('docs',nd,copy.id);
  if(n.thumb){ const b=await nbGet('blobs',n.thumb); if(b){ copy.thumb=await putBlob(b,'th:'); await nbSaveNode(copy); } }
  return copy;
}
