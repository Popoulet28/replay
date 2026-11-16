import { DEFAULT_SETTINGS, fixCourse } from './data.js';
import { clone, el, today } from './helpers.js';
import { blobToDataURL, imgBlob } from './images.js';
import { S, topicsOf } from './state.js';
import { IMG_URLS, idbPut, persistAll } from './storage.js';
import { exportBackupFull, importBackupAny } from '../notes/files.js';
import { NB, nbIsRoot } from '../notes/store.js';
import { confirmBox, go, refresh, render, toast } from '../ui/chrome.js';

/* ================= offline app: backup + back button ================= */
export function backupControls(){
  const inp=el('input',{type:'file',accept:'application/zip,.zip,application/json,.json',style:{display:'none'}});
  inp.addEventListener('change',async()=>{ const f=inp.files[0]; inp.value=''; if(!f) return;
    if(!(await confirmBox('Remplacer tout ce qui est dans l’app par cette sauvegarde ?','Restaurer'))) return;
    try{ await importBackupAny(f); }catch(e){ console.warn(e); toast('Ce fichier n’est pas une sauvegarde Replay valide.','err'); } });
  return el('div',{},
    el('div',{class:'row',style:{marginTop:'6px'}},
      el('button',{class:'btn',type:'button',text:'Exporter une sauvegarde',onclick:exportBackupFull}),
      el('button',{class:'btn ghost',type:'button',text:'Restaurer une sauvegarde',onclick:()=>inp.click()}), inp),
    el('p',{class:'muted small',text:'La sauvegarde est un fichier .zip enregistré dans Téléchargements, avec tes problèmes, tes cours, tes PDF et tes photos.'}));
}
export async function exportBackup(){
  try{
    const imgs={};
    for(const p of S.problems.values()) for(const k of ['problemImg','solutionImg','noteImg']){
      const r=p[k]; if(r && r.startsWith('idb:')){ const b=await imgBlob(r); if(b) imgs[r]=await blobToDataURL(b); } }
    const data=JSON.stringify({app:'replay',v:1,at:new Date().toISOString(),settings:S.settings,problems:Object.fromEntries(S.problems),images:imgs});
    const name='replay-sauvegarde-'+today()+'.json';
    if(window.AndroidBridge && AndroidBridge.saveFile){ const ok=AndroidBridge.saveFile(name,data); toast(ok?'Sauvegarde enregistrée dans Téléchargements':'La sauvegarde a échoué.', ok?'':'err'); }
    else { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download=name; document.body.append(a); a.click(); a.remove(); }
  }catch(e){ console.warn(e); toast('La sauvegarde a échoué.','err'); }
}
export async function importBackup(file){
  const o=JSON.parse(await file.text());
  if(!o || o.app!=='replay' || typeof o.problems!=='object') throw new Error('bad');
  for(const [k,d] of Object.entries(o.images||{})){ const b=await (await fetch(d)).blob(); await idbPut(k,b); IMG_URLS.set(k,URL.createObjectURL(b)); }
  S.settings=Object.assign(clone(DEFAULT_SETTINGS), o.settings||{});
  S.problems=new Map(Object.entries(o.problems||{}).map(([k,v])=>{ v.course=fixCourse(v.course); v.topics=topicsOf(v); return [k,v]; }));
  await persistAll({from:'import'}); render(); toast('Sauvegarde restaurée');
}
window.__back=function(){
  if(NB.editor){ NB.editor.close(); return true; }
  const layer=document.getElementById('layer');
  if(layer && layer.childElementCount){ layer.lastChild.remove(); refresh(); return true; }
  if(S.view==='cours' && S.coursPath){ const n=NB.nodes.get(S.coursPath); S.coursPath = n ? (nbIsRoot(n.parent)?n.parent:n.parent) : null; if(nbIsRoot(S.coursPath) && !n) S.coursPath=null; render(); return true; }
  if(S.view!=='today'){ go('today'); return true; }
  return false;
};

