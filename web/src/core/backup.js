import { buildBackup, imageRefs, openBackup, parseLegacyJson } from './backup-format.js';
import { openCarnet, writeCarnet } from './carnet.js';
import { DB_BASES, dbName, deleteDb, forgetPreviousGeneration, generation, openDb, previousGeneration, setGeneration, tx } from './db.js';
import { clone, el, today } from './helpers.js';
import { hasNativeFiles, hasNativeFolders, saveBlob } from './save-file.js';
import { S } from './state.js';
import { applyCarnet, idbGet, idbPut, persistAll, saveSettings } from './storage.js';
import { progressBox } from '../notes/pdf.js';
import { NB, docBlobKeys, nbAll, nbGet, nbInit, nbIsRoot, nbOpenGen } from '../notes/store.js';
import { confirmBox, go, refresh, render, toast } from '../ui/chrome.js';

/* ================= sauvegarde, restauration, bouton retour ================= */
const AUTO_FOLDER = 'Replay', AUTO_PREFIX = 'replay-auto-', RESTORED_FLAG = 'replay-just-restored';
const DAY = 86400000;
const autoDays = () => (S.settings.autoBackupDays == null ? 7 : S.settings.autoBackupDays);
const lastBackup = () => (S.settings.backup && S.settings.backup.lastAt) || 0;
function agoText(t){
  if (!t) return 'jamais';
  const d = Math.floor((Date.now() - t) / DAY);
  return d <= 0 ? 'aujourd’hui' : d === 1 ? 'hier' : 'il y a ' + d + ' jours';
}

export function backupControls(){
  const inp=el('input',{type:'file',accept:'application/zip,.zip,application/json,.json',style:{display:'none'}});
  inp.addEventListener('change',async()=>{ const f=inp.files[0]; inp.value=''; if(!f) return;
    if(!(await confirmBox('Remplacer ce qui est dans l’appli par cette sauvegarde ? Tes données actuelles sont conservées à côté tant que tu ne les as pas supprimées.','Restaurer'))) return;
    await importBackupAny(f); });
  const box=el('div',{},
    el('div',{class:'row',style:{marginTop:'6px'}},
      el('button',{class:'btn',type:'button',text:'Exporter une sauvegarde',onclick:()=>exportBackupFull()}),
      el('button',{class:'btn ghost',type:'button',text:'Restaurer une sauvegarde',onclick:()=>inp.click()}), inp),
    el('p',{class:'muted small',text:'Dernière sauvegarde : '+agoText(lastBackup())+'. La sauvegarde est un fichier .zip enregistré dans Téléchargements, avec tes problèmes, tes cours, tes PDF et tes photos.'}));
  if (hasNativeFolders()){
    const opts=[[1,'Chaque jour'],[3,'Tous les 3 jours'],[7,'Chaque semaine'],[0,'Jamais']];
    const seg=el('div',{class:'seg seg-sm'}, opts.map(([d,l])=>el('button',{type:'button',class:autoDays()===d?'on':'',text:l,onclick:()=>{ S.settings.autoBackupDays=d; saveSettings(); render(); }})));
    box.append(el('div',{style:{marginTop:'10px'}}, el('div',{class:'small',style:{fontWeight:700,marginBottom:'6px'},text:'Sauvegarde automatique'}), seg,
      el('p',{class:'muted small',text:'Écrite dans Téléchargements/'+AUTO_FOLDER+' à l’ouverture de l’appli ; seules les 2 plus récentes sont gardées.'})));
  }
  const prev=previousGeneration();
  if (prev!==null && prev!==generation()){
    box.append(el('div',{class:'card notice',style:{marginTop:'14px'}},
      el('b',{text:'Données d’avant la dernière restauration'}),
      el('p',{class:'small',text:'Elles sont toujours sur l’appareil. Vérifie que tout est en ordre, puis libère la place.',style:{margin:'6px 0 10px'}}),
      el('div',{class:'row'},
        el('button',{class:'btn small',type:'button',text:'Revenir à ces données',onclick:async()=>{ if(!(await confirmBox('Revenir aux données d’avant la restauration ? Les données restaurées restent disponibles de la même façon.','Revenir'))) return; try{ setGeneration(prev); location.reload(); }catch(e){ toast('Bascule impossible.','err'); } }}),
        el('button',{class:'btn small danger ghost',type:'button',text:'Tout va bien, libérer la place',onclick:async()=>{ if(!(await confirmBox('Supprimer définitivement les données d’avant la restauration ?','Supprimer'))) return; await dropGeneration(prev); forgetPreviousGeneration(); toast('Place libérée'); render(); }}))));
  }
  return box;
}
async function dropGeneration(gen){ for (const base of DB_BASES) await deleteDb(dbName(base, gen)); }

/* Supprime les bases d'une restauration interrompue (ni la génération courante, ni la précédente). */
export async function cleanupGenerations(){
  try{
    if (!indexedDB.databases) return;
    const keep=new Set([generation(), previousGeneration()]);
    for (const d of await indexedDB.databases()){
      const m=/^(replay-(?:carnet|images|notes))@(.+)$/.exec(d.name||'');
      if (m && !keep.has(m[2])) await deleteDb(d.name);
    }
  }catch(e){ console.warn('cleanup', e); }
}

/* ---------- export ---------- */
async function gatherBackup(){
  const problems=[...S.problems.values()].map(clone);
  const images=[]; for (const r of imageRefs(problems)){ const b=await idbGet(r).catch(()=>null); if(b) images.push([r,b]); }
  await nbInit(); const nodes=await nbAll('nodes'); const docs={}; const keys=new Set();
  for (const n of nodes){
    if (n.thumb) keys.add(n.thumb);
    if (n.type!=='note') continue;
    const d=await nbGet('docs',n.id); if(!d) continue; docs[n.id]=d;
    for (const k of docBlobKeys(d)) keys.add(k);
  }
  // seuls les fichiers encore utilisés par une note sont sauvegardés
  const blobs=[]; for (const k of keys){ const b=await nbGet('blobs',k); if(b) blobs.push([k,b]); }
  return {settings:clone(S.settings), problems, images, nodes, docs, blobs};
}
export async function exportBackupFull(opts){
  const auto=!!(opts&&opts.auto);
  const pb=auto?null:progressBox('Préparation de la sauvegarde…');
  try{
    if (NB.editor) await NB.editor.flush();
    const src=await gatherBackup();
    const {blob}=await buildBackup(src, (i,n)=>{ if(pb && (i%5===0||i===n)) pb.set('Fichiers : '+i+' / '+n, i/n*0.6); });
    const name=(auto?AUTO_PREFIX:'replay-sauvegarde-')+today()+'.zip';
    const ok=await saveBlob(name,'application/zip',blob,{folder:auto?AUTO_FOLDER:null, onProgress:f=>{ if(pb) pb.set('Écriture…',0.6+f*0.4); }});
    if(pb) pb.close();
    if(!ok){ if(!auto) toast('La sauvegarde a échoué.','err'); return false; }
    S.settings.backup=Object.assign({}, S.settings.backup, {lastAt:Date.now(), lastName:name, lastSize:blob.size});
    await saveSettings();
    if (auto){ try{ window.AndroidBridge.pruneFiles(AUTO_FOLDER, AUTO_PREFIX, 2); }catch(e){} toast('Sauvegarde automatique faite'); }
    else { if(hasNativeFiles()) toast('Sauvegarde enregistrée dans Téléchargements : '+name); refresh(); }
    return true;
  }catch(e){ if(pb) pb.close(); console.warn(e); if(!auto) toast('La sauvegarde a échoué : '+(e&&e.message||'erreur'),'err'); return false; }
}
/* À l'ouverture : sauvegarde automatique si la dernière est trop ancienne (Android seulement). */
export function maybeAutoBackup(){
  if (!hasNativeFolders() || S.mode!=='local') return;
  const days=autoDays(); if(!days) return;
  if (!S.problems.size && !NB.nodes.size) return;
  if (Date.now()-lastBackup() < days*DAY) return;
  exportBackupFull({auto:true});
}

/* ---------- restauration ---------- */
export async function importBackupAny(file){
  const pb=progressBox('Lecture de la sauvegarde…');
  try{
    if (/\.json$/i.test(file.name)){ await importLegacyJson(file); pb.close(); render(); toast('Sauvegarde restaurée'); return true; }
    const b=await openBackup(file);
    pb.set('Vérification de la sauvegarde…',0.05);
    await b.check();
    if (!b.hasNotes){ await restoreCarnetInPlace(b, pb); pb.close(); render(); toast('Carnet restauré (les cours n’étaient pas dans ce fichier)'); return true; }
    await restoreIntoNewGeneration(b, pb);
    try{ sessionStorage.setItem(RESTORED_FLAG, String(b.missing.length)); }catch(e){}
    pb.close(); location.reload(); return true;
  }catch(e){
    pb.close(); console.warn(e);
    toast('Restauration impossible : '+(e&&e.message||'fichier invalide')+'. Tes données actuelles n’ont pas été touchées.','err');
    return false;
  }
}
/* Écrit TOUTE la sauvegarde dans de nouvelles bases, les contrôle, puis bascule. Les bases en place ne sont jamais modifiées. */
async function restoreIntoNewGeneration(b, pb){
  const gen='g'+Date.now().toString(36); const open=[];
  try{
    const c=await openCarnet(gen); open.push(c);
    await writeCarnet(c, {problems:b.problems, settings:b.settings}, {from:'restore', backupAt:b.at});
    const im=await openDb(dbName('replay-images',gen),1,db=>{ db.createObjectStore('img'); }); open.push(im);
    const total=b.imageKeys.length+b.blobKeys.length||1; let done=0;
    for (const k of b.imageKeys){ const blob=await b.image(k); await tx(im,'img','readwrite',st=>{ st.put(blob,k); }); pb.set('Photos : '+(++done)+' / '+total, 0.1+0.85*done/total); }
    const nd=await nbOpenGen(gen); open.push(nd);
    await tx(nd,['nodes','docs'],'readwrite',(ns,ds)=>{ for(const n of b.nodes) ns.put(n); for(const [id,d] of Object.entries(b.docs)) ds.put(d,id); });
    for (const k of b.blobKeys){ const blob=await b.blob(k); await tx(nd,'blobs','readwrite',st=>{ st.put(blob,k); }); pb.set('Fichiers : '+(++done)+' / '+total, 0.1+0.85*done/total); }
    pb.set('Contrôle…',0.97);
    const got={ problems:await tx(c,'problems','readonly',st=>st.count()), images:await tx(im,'img','readonly',st=>st.count()),
      nodes:await tx(nd,'nodes','readonly',st=>st.count()), docs:await tx(nd,'docs','readonly',st=>st.count()), blobs:await tx(nd,'blobs','readonly',st=>st.count()) };
    for (const k of Object.keys(got)) if (got[k]!==b.counts[k]) throw new Error('copie incomplète ('+k+' : '+got[k]+' sur '+b.counts[k]+')');
    open.forEach(d=>d.close()); open.length=0;
    setGeneration(gen);
  }catch(e){
    open.forEach(d=>{ try{ d.close(); }catch(_){} });
    await dropGeneration(gen);
    throw e;
  }
}
/* Sauvegarde sans cours : seul le carnet est remplacé, en une transaction (tout ou rien). */
async function restoreCarnetInPlace(b, pb){
  let i=0; for (const k of b.imageKeys){ await idbPut(k, await b.image(k)); pb.set('Photos : '+(++i)+' / '+b.imageKeys.length, 0.1+0.8*i/b.imageKeys.length); }
  await replaceCarnet({problems:b.problems, settings:b.settings});
}
async function importLegacyJson(file){
  const o=parseLegacyJson(await file.text());
  for (const [k,d] of Object.entries(o.images)){ const blob=await (await fetch(d)).blob(); await idbPut(k,blob); }
  await replaceCarnet({problems:o.problems, settings:o.settings});
}
async function replaceCarnet(data){
  const before={settings:S.settings, problems:S.problems};
  applyCarnet(data);
  const ok=await persistAll({from:'restore'});
  if (ok===false){ S.settings=before.settings; S.problems=before.problems; throw new Error('écriture impossible'); }
}
/* Après le rechargement qui suit une restauration : message de confirmation. */
export function restoredNotice(){
  let v=null; try{ v=sessionStorage.getItem(RESTORED_FLAG); sessionStorage.removeItem(RESTORED_FLAG); }catch(e){}
  if (v===null) return;
  const miss=Number(v)||0;
  S.notice={kind:'info', text:'Sauvegarde restaurée.'+(miss?' '+miss+' fichier(s) référencé(s) manquaient déjà dans la sauvegarde.':'')+' Tes données d’avant sont conservées : quand tu as vérifié que tout est là, libère la place dans Réglages → Tes données.'};
}

window.__back=function(){
  if(NB.editor){ NB.editor.close(); return true; }
  const layer=document.getElementById('layer');
  if(layer && layer.childElementCount){ layer.lastChild.remove(); refresh(); return true; }
  if(S.view==='cours' && S.coursPath){ const n=NB.nodes.get(S.coursPath); S.coursPath = n ? n.parent : null; if(nbIsRoot(S.coursPath) && !n) S.coursPath=null; render(); return true; }
  if(S.view!=='today'){ go('today'); return true; }
  return false;
};
