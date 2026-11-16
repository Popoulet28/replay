import { el, fmtDate, today, uid, ymd } from '../core/helpers.js';
import { recompress } from '../core/images.js';
import { S, courseColor, courses, shortCourse } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { xpToast } from '../game/game.js';
import { createNote, normalizeDoc, openNote, sendRegionToReplay, stampRect } from '../notes/editor.js';
import { COVERS, dateName, duplicateNote, exportNotePdf, promptBox } from '../notes/files.js';
import { pdfToPages } from '../notes/pdf.js';
import { STAMP, renderRegion } from '../notes/scene.js';
import { NB, nbBlobURL, nbChildren, nbCourseOf, nbCreate, nbDeleteNode, nbDescendantIds, nbGet, nbInit, nbIsRoot, nbNoteCount, nbPut, nbSaveNode, nbStampsOf, putBlob } from '../notes/store.js';
import { PAGE_GAP, TPLS, drawTpl } from '../notes/templates.js';
import { confirmBox, modal, render, toast } from '../ui/chrome.js';

/* ---------------- écrans « Cours » ---------------- */
S.coursPath=null; S.coursTab='files'; S.coursSearch='';
export function viewCours(){
  const root=el('div');
  if(!NB.ready){ root.append(el('div',{class:'card empty muted',text:'Ouverture de tes cours…'})); nbInit().then(()=>{ if(S.view==='cours') render(); }); return root; }
  if(S.coursPath && !nbIsRoot(S.coursPath) && !NB.nodes.has(S.coursPath)) S.coursPath=null;
  return S.coursPath ? coursFolder(root) : coursHome(root);
}
export function notesList(){ return [...NB.nodes.values()].filter(n=>n.type==='note'); }
export function coursHome(root){
  root.append(el('h2',{text:'Cours'}));
  const search=el('input',{type:'text',placeholder:'Chercher une note ou un dossier…',value:S.coursSearch});
  const body=el('div');
  const draw=()=>{ S.coursSearch=search.value; body.replaceChildren(); const q=search.value.trim().toLowerCase();
    if(q){ const hits=[...NB.nodes.values()].filter(n=>n.name.toLowerCase().includes(q)).sort((a,b)=>(b.updated||0)-(a.updated||0));
      body.append(hits.length? nodeGrid(hits,true) : el('p',{class:'muted',text:'Rien trouvé pour « '+search.value+' ».'})); return; }
    const favs=notesList().filter(n=>n.fav).sort((a,b)=>(b.updated||0)-(a.updated||0));
    const recent=notesList().sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,6);
    if(favs.length) body.append(el('h3',{class:'sec-h',text:'Favoris'}), nodeGrid(favs,true));
    if(recent.length) body.append(el('h3',{class:'sec-h',text:'Récents'}), nodeGrid(recent,true));
    body.append(el('h3',{class:'sec-h',text:'Mes cours'}), courseGrid()); };
  search.addEventListener('input',draw);
  root.append(el('div',{style:{marginBottom:'14px'}},search), body); draw();
  return root;
}
export function courseGrid(){
  return el('div',{class:'course-grid'}, courses().map(c=>{
    const n=nbNoteCount(c), q=nbStampsOf(c,'q').filter(x=>!x.s.done).length;
    const card=el('button',{type:'button',class:'course-card',onclick:()=>{ S.coursPath='c:'+c; S.coursTab='files'; render(); window.scrollTo(0,0); }},
      el('div',{class:'cc-name',text:c}), el('div',{class:'muted small',text:n+' note'+(n>1?'s':'')}), q? el('div',{class:'cc-q hand',text:q+' ? à revoir'}):'');
    card.style.setProperty('--cc',courseColor(c)); return card; }));
}
export function crumbs(){
  const parts=[]; let p=S.coursPath, g=0;
  while(p && !nbIsRoot(p) && g++<60){ const n=NB.nodes.get(p); if(!n) break; parts.unshift(n); p=n.parent; }
  const course=nbIsRoot(p)?p.slice(2):'';
  const bc=el('div',{class:'crumbs'}, el('button',{type:'button',class:'crumb',text:'Cours',onclick:()=>{ S.coursPath=null; render(); }}), el('span',{class:'muted',text:'›'}),
    el('button',{type:'button',class:'crumb',text:shortCourse(course),onclick:()=>{ S.coursPath='c:'+course; render(); }}));
  parts.forEach(n=>bc.append(el('span',{class:'muted',text:'›'}), el('button',{type:'button',class:'crumb',text:n.name,onclick:()=>{ S.coursPath=n.id; render(); }})));
  return {el:bc, course};
}
export function newNoteDialog(parent){
  let close, mode='pages', tpl='grid', orient='port', cover=COVERS[0];
  const name=el('input',{type:'text',value:dateName()});
  const tplBox=el('div',{class:'tpl-grid'});
  const drawT=()=>{ tplBox.replaceChildren(...TPLS.map(([id,label])=>{ const c=el('canvas',{width:96,height:120,class:'tpl-c'}); const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,96,120); x.setTransform(0.096,0,0,0.0849,0,0); drawTpl(x,id,{x:0,y:0,w:1000,h:1414},0.2,[0,0,1000,1414],false);
    return el('button',{type:'button',class:'tpl'+(id===tpl?' on':''),onclick:()=>{ tpl=id; drawT(); }}, c, el('span',{class:'small',text:label})); })); };
  const modeSeg=el('div',{class:'seg'}); const drawM=()=>{ modeSeg.replaceChildren(...[['pages','Cahier (pages)'],['infinite','Tableau infini']].map(([v,l])=>el('button',{type:'button',class:mode===v?'on':'',text:l,onclick:()=>{ mode=v; drawM(); orientRow.style.display=mode==='pages'?'':'none'; }}))); };
  const orientSeg=el('div',{class:'seg'}); const drawO=()=>{ orientSeg.replaceChildren(...[['port','Portrait'],['land','Paysage']].map(([v,l])=>el('button',{type:'button',class:orient===v?'on':'',text:l,onclick:()=>{ orient=v; drawO(); }}))); };
  const orientRow=el('div',{}, el('label',{class:'f',text:'Format'}), orientSeg);
  const covers=el('div',{class:'swatches'}); const drawC=()=>{ covers.replaceChildren(...COVERS.map(c=>el('button',{type:'button',class:'swatch'+(c===cover?' on':''),style:{background:c},'aria-label':'Couverture',onclick:()=>{ cover=c; drawC(); }}))); };
  drawT(); drawM(); drawO(); drawC();
  close=modal(el('div',{}, el('h2',{text:'Nouvelle note'}),
    el('label',{class:'f',text:'Nom'}), name, el('label',{class:'f',text:'Type'}), modeSeg, orientRow,
    el('label',{class:'f',text:'Modèle de page'}), tplBox, el('label',{class:'f',text:'Couverture'}), covers,
    el('div',{class:'row',style:{marginTop:'18px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>close()}),
      el('button',{class:'btn primary',type:'button',text:'Créer',onclick:async()=>{ const v=name.value.trim()||dateName(); close(); const n=await createNote(parent,v,{mode,tpl,orient,cover}); openNote(n.id); }}))));
}
export function coursFolder(root){
  const {el:bc, course}=crumbs(); root.append(bc);
  const atRoot=nbIsRoot(S.coursPath);
  const title=atRoot?course:(NB.nodes.get(S.coursPath)||{}).name;
  const h=el('h2',{text:title,class:'nb-title'}); h.style.setProperty('--cc',courseColor(course)); root.append(h);
  if(atRoot){
    const nQ=nbStampsOf(course,'q').filter(x=>!x.s.done).length, nS=nbStampsOf(course,'star').length, nF=nbStampsOf(course,'f').length;
    const seg=el('div',{class:'seg',style:{marginBottom:'16px'}});
    [['files','Fichiers'],['q','? À revoir'+(nQ?' ('+nQ+')':'')],['star','★ Important'+(nS?' ('+nS+')':'')],['f','ƒ Formules'+(nF?' ('+nF+')':'')]].forEach(([id,l])=>seg.append(el('button',{class:S.coursTab===id?'on':'',text:l,onclick:()=>{ S.coursTab=id; render(); }})));
    root.append(seg);
    if(S.coursTab!=='files'){ root.append(stampList(course, S.coursTab)); return root; }
  }
  const parent=S.coursPath;
  const pdfIn=el('input',{type:'file',accept:'application/pdf,.pdf',style:{display:'none'}});
  const imgIn=el('input',{type:'file',accept:'image/*',style:{display:'none'}});
  pdfIn.addEventListener('change',async()=>{ const f=pdfIn.files[0]; pdfIn.value=''; if(!f) return;
    const pages=await pdfToPages(f); if(!pages.length) return;
    let y=0; for(const pg of pages){ pg.x=0; pg.y=y; y+=pg.h+PAGE_GAP; }
    const n=await nbCreate('note',parent,f.name.replace(/\.pdf$/i,''),{mode:'pages', cover:COVERS[5], pages:pages.length});
    await nbPut('docs',{v:2, mode:'pages', tpl:'grid', strokes:[], items:pages, view:null},n.id); openNote(n.id); });
  imgIn.addEventListener('change',async()=>{ const f=imgIn.files[0]; imgIn.value=''; if(!f) return;
    let blob; try{ blob=await recompress(f,2200,0.88,'image/jpeg'); }catch(e){ blob=f; }
    const bmp=await createImageBitmap(blob).catch(()=>null); const ar=bmp?bmp.height/bmp.width:1.3; if(bmp) bmp.close(); const key=await putBlob(blob);
    const n=await nbCreate('note',parent,'Photo du '+fmtDate(today()),{mode:'pages'});
    await nbPut('docs',{v:2, mode:'pages', tpl:'blank', strokes:[], items:[{id:uid(),kind:'page',x:0,y:0,w:1000,h:Math.round(1000*ar),img:key,tpl:'blank'}], view:null},n.id); openNote(n.id); });
  const sortSeg=el('div',{class:'seg seg-sm'}, [['recent','Récents'],['name','A → Z']].map(([v,l])=>el('button',{type:'button',class:(S.settings.nbSort||'recent')===v?'on':'',text:l,onclick:()=>{ S.settings.nbSort=v; saveSettings(); render(); }})));
  const viewSeg=el('div',{class:'seg seg-sm'}, [['grid','Grille'],['list','Liste']].map(([v,l])=>el('button',{type:'button',class:(S.settings.nbView||'grid')===v?'on':'',text:l,onclick:()=>{ S.settings.nbView=v; saveSettings(); render(); }})));
  root.append(el('div',{class:'row',style:{marginBottom:'16px'}},
    el('button',{class:'btn primary',type:'button',text:'＋ Note',onclick:()=>newNoteDialog(parent)}),
    el('button',{class:'btn',type:'button',text:'＋ Dossier',onclick:async()=>{ const v=await promptBox('Nom du dossier','Nouveau dossier'); if(!v) return; await nbCreate('folder',parent,v); render(); }}),
    el('button',{class:'btn',type:'button',text:'Importer un PDF',onclick:()=>pdfIn.click()}),
    el('button',{class:'btn ghost',type:'button',text:'Photo',onclick:()=>imgIn.click()}), pdfIn, imgIn,
    el('span',{class:'spacer'}), sortSeg, viewSeg));
  const kids=nbChildren(parent);
  root.append(kids.length? nodeGrid(kids,false)
    : el('div',{class:'card empty muted',text: atRoot?'Aucune note pour l’instant. Crée un cahier pour ton prochain cours, ou importe le PDF du polycopié pour l’annoter.':'Ce dossier est vide.'}));
  return root;
}
export function nodeGrid(list, showCourse){ const list2=S.settings.nbView==='list'; return el('div',{class:list2?'nb-list':'nb-grid'}, list.map(n=>nodeTile(n,showCourse))); }
export function nodeTile(n, showCourse){
  const isF=n.type==='folder', c=nbCourseOf(n);
  let thumb;
  if(isF) thumb=el('div',{class:'nb-folder'}, el('span',{text:String(nbChildren(n.id).length)}));
  else { thumb=el('div',{class:'nb-cover'+(n.mode==='infinite'?' board':'')}, el('div',{class:'nb-page'})); if(n.cover) thumb.style.setProperty('--cover',n.cover);
    if(n.thumb) nbBlobURL(n.thumb).then(u=>{ if(u) thumb.firstChild.append(el('img',{src:u,alt:'',loading:'lazy'})); }); }
  const q=(n.stamps||[]).filter(s=>s.t==='q'&&!s.done).length;
  const meta=[]; if(showCourse&&c) meta.push(shortCourse(c)); meta.push(fmtDate(ymd(new Date(n.updated||Date.now())))); if(!isF && n.pages>1) meta.push(n.pages+' p.'); if(q) meta.push(q+' ?');
  const tile=el('div',{class:'nb-tile'+(isF?' is-folder':''),role:'button',tabindex:'0',onclick:()=>{ if(isF){ S.coursPath=n.id; render(); window.scrollTo(0,0); } else openNote(n.id); }},
    thumb, n.fav?el('span',{class:'nb-fav',text:'★','aria-label':'Favori'}):'',
    el('div',{class:'nb-meta'}, el('div',{class:'nb-name',text:n.name}), el('div',{class:'muted small',text:meta.join(' · ')})),
    el('button',{type:'button',class:'nb-more','aria-label':'Options',onclick:e=>{ e.stopPropagation(); nodeMenu(n); }},'⋯'));
  tile.addEventListener('keydown',e=>{ if(e.key==='Enter') tile.click(); });
  if(c) tile.style.setProperty('--cc',courseColor(c));
  return tile;
}
export function nodeMenu(n){
  let close; const isNote=n.type==='note';
  const covers=isNote? el('div',{class:'swatches',style:{marginTop:'6px'}}, COVERS.map(c=>el('button',{type:'button',class:'swatch'+(c===n.cover?' on':''),style:{background:c},'aria-label':'Couverture',onclick:async()=>{ n.cover=c; await nbSaveNode(n,true); close(); render(); }}))):'';
  close=modal(el('div',{}, el('h3',{text:n.name}),
    el('div',{class:'menu-col'},
      el('button',{class:'btn',type:'button',text:'Renommer',onclick:async()=>{ close(); const v=await promptBox('Nouveau nom',n.name); if(v){ n.name=v; await nbSaveNode(n); render(); } }}),
      el('button',{class:'btn',type:'button',text:'Déplacer',onclick:()=>{ close(); moveDialog(n); }}),
      isNote? el('button',{class:'btn',type:'button',text:n.fav?'Retirer des favoris':'Ajouter aux favoris',onclick:async()=>{ n.fav=!n.fav; await nbSaveNode(n,true); close(); render(); }}):'',
      isNote? el('button',{class:'btn',type:'button',text:'Dupliquer',onclick:async()=>{ close(); await duplicateNote(n); toast('Note dupliquée'); render(); }}):'',
      isNote? el('button',{class:'btn',type:'button',text:'Exporter en PDF',onclick:()=>{ close(); exportNotePdf(n); }}):'',
      el('button',{class:'btn danger ghost',type:'button',text:'Supprimer',onclick:async()=>{ close();
        const msg=n.type==='folder'?'Supprimer le dossier « '+n.name+' » et tout ce qu’il contient ?':'Supprimer la note « '+n.name+' » ?';
        if(await confirmBox(msg,'Supprimer')){ await nbDeleteNode(n.id); toast('Supprimé'); render(); } }})),
    isNote? el('div',{}, el('label',{class:'f',text:'Couverture'}), covers):'',
    el('div',{class:'row',style:{marginTop:'14px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Fermer',onclick:()=>close()}))));
}
export function moveDialog(n){
  const banned=new Set([n.id, ...nbDescendantIds(n.id)]); let close;
  const list=el('div',{class:'move-list'});
  const add=(id,label,depth,color)=>{ const b=el('button',{type:'button',class:'move-row'+(n.parent===id?' here':''),style:{paddingLeft:(14+depth*22)+'px'},onclick:async()=>{ n.parent=id; await nbSaveNode(n); close(); toast('Déplacé'); render(); }}, label); if(color) b.style.setProperty('--cc',color); list.append(b); };
  const walk=(p,depth)=>{ for(const c of nbChildren(p)) if(c.type==='folder' && !banned.has(c.id)){ add(c.id,'▸ '+c.name,depth); walk(c.id,depth+1); } };
  courses().forEach(c=>{ add('c:'+c, c, 0, courseColor(c)); walk('c:'+c,1); });
  close=modal(el('div',{}, el('h3',{text:'Déplacer « '+n.name+' » vers…'}), list, el('div',{class:'row',style:{marginTop:'12px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>close()}))));
}
export const snapCache=new Map();
export function stampList(course, type){
  const list=nbStampsOf(course,type).sort((a,b)=> type==='q' ? (a.s.done-b.s.done)||((b.node.updated||0)-(a.node.updated||0)) : 0);
  if(!list.length) return el('div',{class:'card empty muted',text: type==='q'?'Aucun passage marqué « pas compris ». Pendant le cours, pose un tampon ? dans la marge quand tu décroches.':type==='star'?'Aucun passage important marqué. Utilise le tampon ★ quand le prof insiste sur un point.':'Aucune formule marquée. Pose un tampon ƒ à côté des formules clés : elles apparaîtront toutes ici.'});
  const box=el('div',{class:'stamp-list'});
  for(const {node,s} of list){
    const img=el('div',{class:'st-snap'}); const key=node.id+':'+s.id+':'+node.updated;
    const fill=u=>img.replaceChildren(el('img',{src:u,alt:''}));
    if(snapCache.has(key)) fill(snapCache.get(key));
    else nbGet('docs',node.id).then(async d=>{ if(!d) return; const b=await renderRegion(normalizeDoc(d), stampRect(s), 760, {noStamps:false}); const u=URL.createObjectURL(b); snapCache.set(key,u); fill(u); });
    const st=STAMP[s.t]||STAMP.q;
    box.append(el('div',{class:'card st-row'+(s.done?' done':'')},
      el('div',{class:'row',style:{marginBottom:'8px'}}, el('span',{class:'stamp-ic',style:{background:s.done?'#1d8a4e':st.color},text:s.done?'✓':st.label}), el('b',{text:node.name}), el('span',{class:'muted small',text:fmtDate(ymd(new Date(node.updated||Date.now())))})),
      img,
      el('div',{class:'row',style:{marginTop:'10px'}},
        el('button',{class:'btn small',type:'button',text:'Ouvrir',onclick:()=>openNote(node.id,{x:s.x,y:s.y})}),
        type==='q'? el('button',{class:'btn small',type:'button',text:s.done?'Pas résolu':'Résolu ✓',onclick:()=>setStampDone(node,s.id,!s.done)}):'',
        el('button',{class:'btn small ghost',type:'button',text:'→ Carnet Replay',onclick:async()=>{ const d=await nbGet('docs',node.id); if(d) await sendRegionToReplay(node,normalizeDoc(d),stampRect(s)); }}))));
  }
  return box;
}
export async function setStampDone(node, sid, done){
  const d=await nbGet('docs',node.id); if(!d) return;
  d.items=(d.items||[]).map(i=>i.id===sid?Object.assign({},i,{done}):i);
  await nbPut('docs',d,node.id);
  node.stamps=(node.stamps||[]).map(s=>s.id===sid?Object.assign({},s,{done}):s);
  await nbSaveNode(node); if(done) xpToast(10, nbCourseOf(node)||'Cours'); render();
}

