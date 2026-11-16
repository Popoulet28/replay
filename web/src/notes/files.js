import { importBackup } from '../core/backup.js';
import { DEFAULT_SETTINGS, fixCourse } from '../core/data.js';
import { clone, el, parseYmd, today, uid } from '../core/helpers.js';
import { S, topicsOf } from '../core/state.js';
import { IMG_URLS, idbPut, persistLocal } from '../core/storage.js';
import { BMP } from './bitmaps.js';
import { normalizeDoc } from './editor.js';
import { unionBox } from './objects.js';
import { loadScriptLib, progressBox } from './pdf.js';
import { renderRegion } from './scene.js';
import { NB, docBlobKeys, nbAll, nbClear, nbCreate, nbGet, nbInit, nbKeys, nbPut, nbSaveNode, putBlob } from './store.js';
import { modal, render, toast } from '../ui/chrome.js';

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
  if(window.AndroidBridge && AndroidBridge.beginFile){
    if(!AndroidBridge.beginFile(name, mime)){ toast('Enregistrement impossible.','err'); return false; }
    const CH=3*65536;
    for(let i=0;i<bytes.length;i+=CH){ const part=bytes.subarray(i,i+CH); let s=''; for(let j=0;j<part.length;j+=8190) s+=String.fromCharCode.apply(null, part.subarray(j,j+8190));
      if(!AndroidBridge.appendBase64(btoa(s))){ toast('Enregistrement interrompu.','err'); return false; } }
    const ok=AndroidBridge.endFile(); toast(ok?'Enregistré dans Téléchargements : '+name:'Enregistrement impossible.', ok?'':'err'); return ok;
  }
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([bytes],{type:mime})); a.download=name; document.body.append(a); a.click(); a.remove(); return true;
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
/* sauvegarde complète (.zip) : carnet Replay + cours */
export async function exportBackupFull(){
  const pb=progressBox('Préparation de la sauvegarde…');
  try{
    const JSZip=await loadScriptLib('lib/jszip.min.js','JSZip'); const z=new JSZip();
    z.file('replay.json', JSON.stringify({app:'replay', v:3, at:new Date().toISOString(), settings:S.settings, problems:Object.fromEntries(S.problems)}));
    for(const p of S.problems.values()) for(const k of ['problemImg','solutionImg','noteImg']){ const r=p[k]; if(r&&r.startsWith('idb:')&&IMG_URLS.has(r)) z.file('images/'+encodeURIComponent(r), await (await fetch(IMG_URLS.get(r))).blob()); }
    await nbInit(); const nodes=await nbAll('nodes'); const docs={};
    for(const n of nodes) if(n.type==='note'){ const d=await nbGet('docs',n.id); if(d) docs[n.id]=d; }
    z.file('notes.json', JSON.stringify({nodes, docs}));
    const keys=await nbKeys('blobs'); let i=0;
    for(const k of keys){ const b=await nbGet('blobs',k); if(b) z.file('blobs/'+encodeURIComponent(k), b); i++; if(i%5===0) pb.set('Fichiers : '+i+' / '+keys.length, i/keys.length*0.6); }
    const bytes=await z.generateAsync({type:'uint8array', compression:'STORE'}, m=>pb.set('Assemblage…',0.6+m.percent/250));
    pb.close(); await saveBinary('replay-sauvegarde-'+today()+'.zip','application/zip',bytes);
  }catch(e){ pb.close(); console.warn(e); toast('La sauvegarde a échoué.','err'); }
}
export async function importBackupAny(file){
  if(/\.json$/i.test(file.name)) return importBackup(file);
  const pb=progressBox('Restauration…');
  try{
    const JSZip=await loadScriptLib('lib/jszip.min.js','JSZip'); const z=await JSZip.loadAsync(file);
    const mf=z.file('replay.json'); if(!mf) throw new Error('bad');
    const o=JSON.parse(await mf.async('string')); if(o.app!=='replay') throw new Error('bad');
    const files=Object.values(z.files).filter(f=>!f.dir); let i=0;
    for(const f of files) if(f.name.startsWith('images/')){ const k=decodeURIComponent(f.name.slice(7)); const b=new Blob([await f.async('uint8array')],{type:'image/jpeg'}); await idbPut(k,b); IMG_URLS.set(k,URL.createObjectURL(b)); }
    S.settings=Object.assign(clone(DEFAULT_SETTINGS), o.settings||{});
    S.problems=new Map(Object.entries(o.problems||{}).map(([k,v])=>{ v.course=fixCourse(v.course); v.topics=topicsOf(v); return [k,v]; }));
    persistLocal();
    const nf=z.file('notes.json');
    if(nf){ const nj=JSON.parse(await nf.async('string'));
      await nbClear('nodes'); await nbClear('docs'); await nbClear('blobs'); NB.nodes.clear(); NB.urls.clear(); BMP.map.clear(); BMP.px=0;
      for(const n of nj.nodes||[]){ await nbPut('nodes',n); NB.nodes.set(n.id,n); }
      for(const [id,d] of Object.entries(nj.docs||{})) await nbPut('docs',d,id);
      for(const f of files) if(f.name.startsWith('blobs/')){ const k=decodeURIComponent(f.name.slice(6)); await nbPut('blobs', new Blob([await f.async('uint8array')],{type:k.startsWith('pdf:')?'application/pdf':'image/jpeg'}), k); i++; if(i%5===0) pb.set('Fichiers : '+i, Math.min(1,i/files.length)); }
    }
    pb.close(); render(); toast('Sauvegarde restaurée');
  }catch(e){ pb.close(); console.warn(e); toast('Ce fichier n’est pas une sauvegarde Replay valide.','err'); }
}

