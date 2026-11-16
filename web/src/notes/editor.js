import { clone, el, today, uid } from '../core/helpers.js';
import { recompress, storeImage } from '../core/images.js';
import { S, courses } from '../core/state.js';
import { saveProblem } from '../core/storage.js';
import { xpToast } from '../game/game.js';
import { exportNotePdf, promptBox } from './files.js';
import { drawStroke, hitStroke, outlinePoints, pointInPoly, polyPath, recognizeShape, shapeToPts, splitStroke, strokeBox } from './geometry.js';
import { TEXT_FONTS, itemBox, textBox, unionBox } from './objects.js';
import { pdfToPages } from './pdf.js';
import { PENS } from './pens.js';
import { ER_SIZES, HL_COLORS, HL_SIZES, PEN_COLORS, PEN_SIZES, inkPrefs, inkPrefsChanged } from './prefs.js';
import { STAMP, drawScene, renderRegion } from './scene.js';
import { NB, nbCourseOf, nbCreate, nbDel, nbForget, nbGet, nbInit, nbPut, nbSaveNode, putBlob } from './store.js';
import { PAGE_GAP, TPLS, drawTpl } from './templates.js';
import { newSrs } from '../srs/schedule.js';
import { buzz, confirmBox, modal, render, toast } from '../ui/chrome.js';

/* =====================================================================
   Cours v2 — éditeur (partie 2)
   ===================================================================== */
export const ICONS={
  back:'M15 5l-7 7 7 7', pen:'M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3', hl:'M4.5 20h7M7 16.5l8.5-11 4 3.2-8.5 11H7z',
  eraser:'M4 15.5 13.5 6l5 5L9 20.5H6.5zM9 20.5h11', lasso:'M12 4c4.4 0 8 2.2 8 5s-3.6 5-8 5-8-2.2-8-5 3.6-5 8-5zM7 13c-1.4 2.2-.2 4.5 2.4 4.5 2.2 0 2.6 1.6 1.6 3.5',
  shape:'M4 20h8l-4-7.5zM14 4h6v6h-6zM14 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0', text:'M5 7V4h14v3M12 4v16M9 20h6',
  laser:'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2 2M16.7 16.7l2 2M18.7 5.3l-2 2M7.3 16.7l-2 2M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  hand:'M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.2 7-2.4 0-3.8-1.3-5.2-3.4L4.1 15c-.8-1.2.8-2.6 1.9-1.6L8 15.2',
  stamp:'M12 3.5a3.8 3.8 0 0 0-2 7.1V13H6v3.5h12V13h-4v-2.4a3.8 3.8 0 0 0-2-7.1zM5 20.5h14',
  undo:'M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10h-3', redo:'M15 5l5 5-5 5M20 10H10a5 5 0 0 0 0 10h3',
  pages:'M7 3h10v18H7zM10 7.5h4M10 11h4', plus:'M12 5v14M5 12h14', more:'M5.5 12h.01M12 12h.01M18.5 12h.01',
  full:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', finger:'M10 11.5V5a2 2 0 0 1 4 0v8.2l3-1.4c1.1-.5 2.2.5 1.8 1.6L16.3 20H9.4l-3.2-5.3c-.6-1 .6-2.2 1.6-1.5l2.2 1.6',
  image:'M4 5h16v14H4zM4 16l5-5 4 4 2.5-2.5L20 17M15.5 8.5h.01', camera:'M4 8h3.5L9 5.5h6L16.5 8H20v11H4zM12 10.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  pdf:'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 16.5h4', page:'M7 3h7l4 4v14H7zM14 3v4h4', paste:'M9 4h6v3H9zM7 5.5H5.5V21h13V5.5H17'
};
export function icon(name, extra){
  const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('class','ic'+(extra?' '+extra:''));
  const p=document.createElementNS(NS,'path'); p.setAttribute('d',ICONS[name]||''); p.setAttribute('fill','none'); p.setAttribute('stroke','currentColor');
  p.setAttribute('stroke-width', name==='more'?'3.2':'1.8'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round'); svg.append(p); return svg;
}
export function normalizeDoc(d){
  d=d||{};
  const out={v:2, mode:d.mode||'infinite', tpl:d.tpl||'blank', strokes:[], items:[], view:d.view||null};
  for(const st of (d.strokes||[])){
    if(st.size!=null) out.strokes.push(st);
    else out.strokes.push({id:st.id||uid(), tool:st.tool, pen:'ball', color:st.color, size:st.w||(st.tool==='hl'?16:2.3), pts:st.pts});
  }
  for(const it of (d.items||[])){
    if(it.kind==='img' && it.pdf===true) out.items.push({id:it.id||uid(), kind:'page', x:it.x, y:it.y, w:it.w, h:it.h, img:it.blob, tpl:'blank'});
    else out.items.push(it);
  }
  return out;
}
export function newPage(tpl, orient){ const land=orient==='land'; return {id:uid(), kind:'page', x:land?-207:0, y:0, w:land?1414:1000, h:land?1000:1414, tpl:tpl||'grid'}; }
export async function createNote(parent, name, o){
  o=o||{};
  const n=await nbCreate('note',parent,name,{mode:o.mode||'pages', cover:o.cover||null, fav:false});
  const doc={v:2, mode:o.mode||'pages', tpl:o.tpl||'grid', strokes:[], items:[], view:null};
  if(doc.mode==='pages' && !o.noPage){ const pg=newPage(o.tpl||'grid', o.orient); doc.items.push(pg); }
  await nbPut('docs',doc,n.id); return n;
}
export async function openNote(id, focus){
  await nbInit(); const node=NB.nodes.get(id); if(!node) return;
  const doc=normalizeDoc(await nbGet('docs',id));
  const ed=makeEditor(node, doc, focus);
  document.getElementById('layer').append(ed.root); NB.editor=ed; ed.start();
}
export async function sendRegionToReplay(node, scene, rect){
  const blob=await renderRegion(scene, rect, 1400, {noStamps:true});
  const ref=await storeImage(blob);
  const course=nbCourseOf(node)||courses()[0];
  const p={ id:uid(), created:today(), createdAt:Date.now(), course, topics:[], reasons:[], source:node.name,
    problemImg:ref, problemText:null, solutionImg:null, solutionText:null, noteImg:null, noteText:null, srs:newSrs(), history:[], archived:false };
  await saveProblem(p);
  toast('Ajouté à ton carnet · +10 XP');
}
export function stampRect(s){ return s.t==='f'||s.stamp==='f' ? {x:s.x-40,y:s.y-130,w:900,h:300} : {x:s.x-60,y:s.y-170,w:1000,h:380}; }

export function makeEditor(node, doc, focus){
  const P=inkPrefs();
  const mode=doc.mode;
  let strokes=doc.strokes, items=doc.items;
  const scene=()=>({mode, tpl:doc.tpl, strokes, items});
  const PAPER = mode==='infinite' ? '#fffefa' : '#e8e7e1';

  /* ---------- DOM ---------- */
  const root=el('div',{class:'editor'+(S.edFull?' full':'')});
  const wrap=el('div',{class:'ed-wrap'});
  const base=el('canvas',{class:'ed-base'}), ink=el('canvas',{class:'ed-ink'});
  wrap.append(base, ink);
  const bctx=base.getContext('2d',{alpha:false});
  let ictx=null; try{ ictx=ink.getContext('2d',{desynchronized:true}); }catch(_){} if(!ictx) ictx=ink.getContext('2d');
  const cache=document.createElement('canvas'); const cctx=cache.getContext('2d',{alpha:false});
  let W=1,H=1,dpr=1,M=200;
  let view=doc.view?Object.assign({},doc.view):{s:1,tx:40,ty:40}, cv={s:1,tx:0,ty:0};
  let hidden=null, needRender=true, raf=0, sharpT=0;
  let tool='pen', stampType='q';
  const hist=[], redoStack=[];
  let dirty=false, viewDirty=false, saveT=null, closed=false, penSeen=false, lastPenUp=0;
  let sel=null, textEd=null, laser=[], laserRaf=0, pop=null;
  const toW=(x,y)=>[(x-view.tx)/view.s,(y-view.ty)/view.s];
  const toS=(x,y)=>[x*view.s+view.tx,y*view.s+view.ty];
  const pos=e=>{ const r=wrap.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };

  /* ---------- rendu : couche mise en cache + composition ---------- */
  function sizeAll(){
    const r=wrap.getBoundingClientRect(); W=Math.max(1,Math.round(r.width)); H=Math.max(1,Math.round(r.height));
    dpr=Math.min(window.devicePixelRatio||1, 2.5); M=Math.round(Math.min(360,Math.max(W,H)*0.25));
    for(const c of [base,ink]){ c.width=Math.round(W*dpr); c.height=Math.round(H*dpr); c.style.width=W+'px'; c.style.height=H+'px'; }
    cache.width=Math.round((W+2*M)*dpr); cache.height=Math.round((H+2*M)*dpr);
    needRender=true; frame();
  }
  const cacheWorld=()=>[(-M-cv.tx)/cv.s,(-M-cv.ty)/cv.s,(W+M-cv.tx)/cv.s,(H+M-cv.ty)/cv.s];
  const viewWorld=()=>[(-view.tx)/view.s,(-view.ty)/view.s,(W-view.tx)/view.s,(H-view.ty)/view.s];
  function covered(){ const c=cacheWorld(), v=viewWorld(); return v[0]>=c[0]-1e-6&&v[1]>=c[1]-1e-6&&v[2]<=c[2]+1e-6&&v[3]<=c[3]+1e-6; }
  function setCacheTransform(){ cctx.setTransform(dpr*cv.s,0,0,dpr*cv.s,dpr*(cv.tx+M),dpr*(cv.ty+M)); }
  const sceneOpts=vis=>({s:cv.s, dpr, vis, exclude:hidden, onAsset:invalidate, onLo:quietDirty, shadows:mode!=='infinite', hires:true});
  function renderCache(){
    cv={s:view.s,tx:view.tx,ty:view.ty};
    cctx.setTransform(1,0,0,1,0,0); cctx.fillStyle=PAPER; cctx.fillRect(0,0,cache.width,cache.height);
    setCacheTransform(); drawScene(cctx, scene(), sceneOpts(cacheWorld()));
  }
  function renderRect(b){ // b = rectangle monde à redessiner dans le cache
    const c=cacheWorld(); const r=[Math.max(b.x,c[0]),Math.max(b.y,c[1]),Math.min(b.x+b.w,c[2]),Math.min(b.y+b.h,c[3])];
    if(r[0]>=r[2]||r[1]>=r[3]) return;
    setCacheTransform(); cctx.save(); cctx.beginPath(); cctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]); cctx.clip();
    cctx.fillStyle=PAPER; cctx.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1]);
    drawScene(cctx, scene(), sceneOpts(r)); cctx.restore();
  }
  function compose(){
    bctx.setTransform(1,0,0,1,0,0); bctx.fillStyle=PAPER; bctx.fillRect(0,0,base.width,base.height);
    const k=view.s/cv.s; bctx.setTransform(k,0,0,k,(view.tx-k*(M+cv.tx))*dpr,(view.ty-k*(M+cv.ty))*dpr);
    bctx.drawImage(cache,0,0); placeOverlays();
  }
  function frame(){ raf=0; if(needRender){ needRender=false; renderCache(); } compose(); }
  function schedule(){ if(!raf) raf=requestAnimationFrame(frame); }
  function invalidate(){ needRender=true; schedule(); }
  function viewMoved(){
    viewDirty=true; const k=view.s/cv.s;
    if(!covered() || k<0.6 || k>1.7) needRender=true;
    schedule(); clearTimeout(sharpT);
    sharpT=setTimeout(()=>{ if(Math.abs(view.s-cv.s)>1e-9 || !covered()) invalidate(); scheduleSave(); },170);
  }

  /* ---------- historique & sauvegarde ---------- */
  function snap(){ hist.push({strokes, items}); if(hist.length>120) hist.shift(); redoStack.length=0; }
  function changed(){ dirty=true; scheduleSave(); updateCounts(); }
  function quietDirty(){ dirty=true; scheduleSave(); }
  function scheduleSave(){ clearTimeout(saveT); saveT=setTimeout(save,900); }
  function undo(){ finishText(); if(!hist.length) return toast('Rien à annuler'); redoStack.push({strokes,items}); const h=hist.pop(); strokes=h.strokes; items=h.items; setSel(null); changed(); invalidate(); refreshPanel(); }
  function redo(){ finishText(); if(!redoStack.length) return; hist.push({strokes,items}); const h=redoStack.pop(); strokes=h.strokes; items=h.items; setSel(null); changed(); invalidate(); refreshPanel(); }
  async function save(){
    clearTimeout(saveT); if(!dirty && !viewDirty) return;
    const wasDirty=dirty; dirty=false; viewDirty=false;
    await nbPut('docs',{v:2, mode, tpl:doc.tpl, strokes, items, view}, node.id);
    if(wasDirty){ node.stamps=items.filter(i=>i.kind==='stamp').map(i=>({id:i.id,t:i.stamp,done:!!i.done,x:i.x,y:i.y}));
      node.pages=items.filter(i=>i.kind==='page').length; node.thumbStale=true; await nbSaveNode(node); }
  }
  async function makeThumb(){
    let r=null; const pg=pagesSorted()[0];
    if(mode==='pages' && pg) r={x:pg.x,y:pg.y,w:pg.w,h:pg.h};
    else { const b=unionBox(strokes, items); if(b){ const pad=40; r={x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:Math.min(b.h+2*pad,(b.w+2*pad)*1.3)}; } }
    if(node.thumb){ await nbDel('blobs',node.thumb); nbForget(node.thumb); node.thumb=null; }
    if(r){ const blob=await renderRegion(scene(), r, 420, {q:0.8}); node.thumb=await putBlob(blob,'th:'); }
    node.thumbStale=false; await nbSaveNode(node,true);
  }
  async function close(){
    if(closed) return; closed=true; finishText();
    await save(); if(node.thumbStale || !node.thumb) await makeThumb().catch(e=>console.warn(e));
    window.removeEventListener('resize',sizeAll); window.removeEventListener('keydown',onKey);
    root.remove(); NB.editor=null; render();
  }

  /* ---------- pages ---------- */
  const pagesSorted=()=>items.filter(i=>i.kind==='page').sort((a,b)=>a.y-b.y);
  function pageAt(wx,wy){ for(const p of items) if(p.kind==='page' && wx>=p.x-30 && wx<=p.x+p.w+30 && wy>=p.y-PAGE_GAP/2 && wy<=p.y+p.h+PAGE_GAP/2) return p.id; return null; }
  function relayout(order, drop){
    const shift=new Map(); let y=0; const pages=[];
    for(const pg of order){ const np=Object.assign({},pg,{x:500-pg.w/2, y}); shift.set(pg.id,[np.x-pg.x, y-pg.y]); pages.push(np); y+=pg.h+PAGE_GAP; }
    const mv=(o,f)=>{ if(o.pg==null) return o; if(drop&&drop.has(o.pg)) return null; const d=shift.get(o.pg); if(!d||(!d[0]&&!d[1])) return o; return f(o,d[0],d[1]); };
    strokes=strokes.map(st=>mv(st,(o,dx,dy)=>{ const a=o.pts.slice(); for(let i=0;i<a.length;i+=3){ a[i]+=dx; a[i+1]+=dy; } return Object.assign({},o,{pts:a}); })).filter(Boolean);
    items=items.filter(i=>i.kind!=='page').map(it=>mv(it,(o,dx,dy)=>Object.assign({},o,{x:o.x+dx,y:o.y+dy}))).filter(Boolean).concat(pages);
  }
  function currentPage(){ const ps=pagesSorted(); if(!ps.length) return null; const [,cy]=toW(W/2,H*0.4); let best=ps[0]; for(const p of ps){ if(p.y<=cy) best=p; } return best; }
  function goPage(pg, smooth){ if(!pg) return; const s=Math.min(1.6,(W-40)/pg.w); view.s=s; view.tx=(W-pg.w*s)/2-pg.x*s; view.ty=16-pg.y*s; viewMoved(); invalidate(); }
  function addPage(afterId, tpl, orient){
    finishText(); snap(); const ps=pagesSorted(); const np=newPage(tpl||(ps.find(p=>p.id===afterId)||ps[ps.length-1]||{}).tpl||doc.tpl||'grid', orient);
    const i=ps.findIndex(p=>p.id===afterId); ps.splice(i<0?ps.length:i+1,0,np); relayout(ps); changed(); invalidate(); refreshPanel();
    const placed=items.find(p=>p.id===np.id); goPage(placed); toast('Page ajoutée');
  }
  function dupPage(id){
    snap(); const ps=pagesSorted(); const i=ps.findIndex(p=>p.id===id); if(i<0) return; const src=ps[i]; const cp=Object.assign({},src,{id:uid(), bm:false});
    const dy=src.h+PAGE_GAP;
    const ns=strokes.filter(s=>s.pg===id).map(s=>{ const a=s.pts.slice(); for(let k=1;k<a.length;k+=3) a[k]+=dy; return Object.assign({},s,{id:uid(),pts:a,pg:cp.id}); });
    const ni=items.filter(it=>it.pg===id && it.kind!=='page').map(it=>Object.assign({},it,{id:uid(),y:it.y+dy,pg:cp.id}));
    cp.y=src.y+dy; strokes=strokes.concat(ns); items=items.concat(ni); ps.splice(i+1,0,cp); relayout(ps); changed(); invalidate(); refreshPanel(); toast('Page dupliquée');
  }
  async function delPage(id){
    const ps=pagesSorted(); if(ps.length<=1){ toast('Un cahier garde au moins une page.','err'); return; }
    if(!(await confirmBox('Supprimer cette page et ce qui est écrit dessus ?','Supprimer'))) return;
    snap(); relayout(ps.filter(p=>p.id!==id), new Set([id])); changed(); invalidate(); refreshPanel();
  }
  function movePage(id, dir){ const ps=pagesSorted(); const i=ps.findIndex(p=>p.id===id), j=i+dir; if(i<0||j<0||j>=ps.length) return; snap(); [ps[i],ps[j]]=[ps[j],ps[i]]; relayout(ps); changed(); invalidate(); refreshPanel(); goPage(items.find(p=>p.id===id)); }
  function setPageProp(id, patch){ snap(); items=items.map(p=>p.id===id?Object.assign({},p,patch):p); changed(); invalidate(); refreshPanel(); }

  /* ---------- couche « encre vivante » ---------- */
  function clearInk(){ ictx.setTransform(1,0,0,1,0,0); ictx.clearRect(0,0,ink.width,ink.height); }
  function inkWorld(){ ictx.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*view.tx,dpr*view.ty); }
  function straightPts(a){ if(a.length<6) return a; let x0=a[0],y0=a[1],x1=a[a.length-3],y1=a[a.length-2]; const ang=Math.atan2(y1-y0,x1-x0); if(Math.abs(Math.sin(ang))<0.14) y1=y0; else if(Math.abs(Math.cos(ang))<0.14) x1=x0; return [x0,y0,a[2],x1,y1,a[a.length-1]]; }
  let cur=null;
  function drawLive(pred){
    clearInk(); if(!cur) return; inkWorld();
    let pts=cur.pts; if(pred && pred.length && !cur.snapped) pts=pts.concat(pred);
    if(cur.tool==='hl' && P.hl.straight && !cur.snapped) pts=straightPts(pts);
    const tmp={tool:cur.tool, pen:cur.pen, size:cur.size, color:cur.color, pts};
    if(cur.tool==='hl'){ ictx.save(); ictx.globalAlpha=0.42; ictx.lineCap='round'; ictx.lineJoin='round'; ictx.strokeStyle=cur.color; ictx.lineWidth=cur.size; const p=new Path2D(); p.moveTo(pts[0],pts[1]); for(let i=3;i<pts.length;i+=3) p.lineTo(pts[i],pts[i+1]); if(pts.length===3) p.lineTo(pts[0]+0.01,pts[1]); ictx.stroke(p); ictx.restore(); }
    else drawStroke(ictx, tmp, polyPath(outlinePoints(pts, cur.size, cur.pen, true)));
  }
  let lastSpeed=0;
  function pressureOf(ev, prevPt, now){
    if(ev.pointerType==='pen' && ev.pressure>0) return Math.round(ev.pressure*100)/100;
    if(!prevPt) return 0.55;
    const dt=Math.max(1, now-(prevPt.t||now)); const v=Math.hypot(ev.clientX-prevPt.x, ev.clientY-prevPt.y)/dt; lastSpeed=lastSpeed*0.7+v*0.3;
    return Math.round(Math.max(0.25, Math.min(0.75, 0.72-lastSpeed*0.18))*100)/100;
  }

  /* ---------- entrée stylet / doigts ---------- */
  const touches=new Map(); let gesture=null, act=null, tap=null;
  const useRaw='onpointerrawupdate' in window;
  function startPinch(){
    const t=[...touches.values()]; const a=t[0].p, b=t[1].p;
    gesture={type:'pinch', d0:Math.hypot(a[0]-b[0],a[1]-b[1])||1, m0:[(a[0]+b[0])/2,(a[1]+b[1])/2], v0:Object.assign({},view)};
  }
  function onDown(e){
    closePop();
    try{ ink.setPointerCapture(e.pointerId); }catch(_){}
    const p=pos(e), now=performance.now();
    if(e.pointerType==='touch'){
      if(act && act.ptype==='pen') return;
      if(now-lastPenUp<350 && penSeen) return;
      touches.set(e.pointerId,{p, p0:p});
      if(!tap) tap={t0:now, max:0, moved:false};
      tap.max=Math.max(tap.max,touches.size);
      if(touches.size>=2){ if(act && act.ptype==='touch'){ cancelAct(); } startPinch(); return; }
      if(!P.finger || tool==='hand'){ gesture={type:'pan', id:e.pointerId, last:p}; return; }
    } else if(e.pointerType==='mouse' && (e.button===1||e.button===2||spaceDown)){ gesture={type:'pan', id:e.pointerId, last:p}; e.preventDefault(); return; }
    if(tool==='hand' && e.pointerType!=='pen'){ gesture={type:'pan', id:e.pointerId, last:p}; return; }
    if(act) return;
    if(e.pointerType==='pen'){ penSeen=true; if(gesture && gesture.type==='pan') gesture=null; }
    let t=tool;
    if(e.pointerType==='pen' && P.penButton && ((e.buttons&32)||(e.buttons&2)||e.button===5||e.button===2)) t='eraser';
    startTool(e, p, t);
    e.preventDefault();
  }
  function startTool(e, p, t){
    const w=toW(p[0],p[1]), now=performance.now();
    act={id:e.pointerId, ptype:e.pointerType, tool:t, p0:p, moved:false};
    if(t!=='eraser' && t!=='lasso'){ const hit=stampAt(p); if(hit){ act.kind='tap-stamp'; act.hit=hit; return; } }
    if(sel && t!=='lasso') setSel(null);
    if(textEd && t!=='text') finishText();
    if(t==='pen'||t==='hl'||t==='shape'){
      act.kind='stroke'; act.last={x:e.clientX,y:e.clientY,t:now}; lastSpeed=0;
      const isHl=t==='hl';
      cur={id:uid(), tool:isHl?'hl':'pen', pen:t==='shape'?'ball':P.pen.type, color:isHl?P.hl.color:P.pen.color, size:isHl?P.hl.size:(t==='shape'?Math.max(1.8,P.pen.size):P.pen.size), pts:[r1(w[0]),r1(w[1]),pressureOf(e,null,now)], forceShape:t==='shape'};
      armHold(p); drawLive();
    } else if(t==='eraser'){ act.kind='erase'; act.snapped=false; act.erased=false; eraseAt(p); }
    else if(t==='lasso'){ act.kind='lasso'; act.poly=[w]; act.scr=[p]; drawLasso(); }
    else if(t==='text'){ act.kind='tap-text'; act.w=w; }
    else if(t==='laser'){ act.kind='laser'; laser.push({x:p[0],y:p[1],t:now}); runLaser(); }
    else if(t==='stamp'){ act.kind='none'; addStamp(w); }
    else act.kind='none';
  }
  const r1=v=>Math.round(v*10)/10;
  function armHold(p){ clearTimeout(act.holdT); act.holdP=p; act.holdT=setTimeout(trySnapShape,520); }
  function trySnapShape(){
    if(!act || act.kind!=='stroke' || !cur || cur.snapped || cur.pts.length<18) return;
    const sh=recognizeShape(cur.pts); if(!sh) return;
    let ps=0,n=0; for(let i=2;i<cur.pts.length;i+=3){ ps+=cur.pts[i]; n++; }
    cur.pts=shapeToPts(sh, Math.max(0.45,ps/n)); cur.snapped=true; cur.pen=cur.tool==='hl'?cur.pen:'ball'; drawLive(); buzz(10);
  }
  function onMove(e, raw){
    const p=pos(e);
    if(touches.has(e.pointerId)){
      const t=touches.get(e.pointerId); t.p=p;
      if(tap && Math.hypot(p[0]-t.p0[0],p[1]-t.p0[1])>12) tap.moved=true;
      if(gesture && gesture.type==='pinch' && touches.size>=2){
        const tt=[...touches.values()]; const a=tt[0].p, b=tt[1].p; const d=Math.hypot(a[0]-b[0],a[1]-b[1])||1, m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        const v0=gesture.v0, s=Math.max(0.1,Math.min(10,v0.s*d/gesture.d0)); const wx=(gesture.m0[0]-v0.tx)/v0.s, wy=(gesture.m0[1]-v0.ty)/v0.s;
        view.s=s; view.tx=m[0]-wx*s; view.ty=m[1]-wy*s; viewMoved(); return;
      }
    }
    if(gesture && gesture.type==='pan' && gesture.id===e.pointerId){ view.tx+=p[0]-gesture.last[0]; view.ty+=p[1]-gesture.last[1]; gesture.last=p; viewMoved(); return; }
    if(!act || act.id!==e.pointerId) return;
    if(Math.hypot(p[0]-act.p0[0],p[1]-act.p0[1])>8) act.moved=true;
    if(act.kind==='stroke'){
      if(useRaw && !raw) return;
      if(cur.snapped) return;
      const evs=(e.getCoalescedEvents && e.getCoalescedEvents().length)?e.getCoalescedEvents():[e];
      const r=wrap.getBoundingClientRect();
      for(const ev of evs){
        const sx=ev.clientX-r.left, sy=ev.clientY-r.top; const a=cur.pts; const [lx,ly]=toS(a[a.length-3],a[a.length-2]);
        if(Math.hypot(sx-lx,sy-ly)<0.9) continue;
        const now=ev.timeStamp||performance.now(); const pr=pressureOf(ev, act.last, now); act.last={x:ev.clientX,y:ev.clientY,t:now};
        const w=toW(sx,sy); a.push(r1(w[0]),r1(w[1]),pr);
        if(Math.hypot(sx-act.holdP[0],sy-act.holdP[1])>3) armHold([sx,sy]);
      }
      let pred=null;
      if(e.getPredictedEvents){ const pe=e.getPredictedEvents(); if(pe&&pe.length){ pred=[]; for(const ev of pe.slice(0,2)){ const w=toW(ev.clientX-r.left, ev.clientY-r.top); pred.push(w[0],w[1],cur.pts[cur.pts.length-1]); } } }
      drawLive(pred); return;
    }
    if(act.kind==='erase'){ eraseAt(p); return; }
    if(act.kind==='lasso'){ act.poly.push(toW(p[0],p[1])); act.scr.push(p); drawLasso(); return; }
    if(act.kind==='laser'){ laser.push({x:p[0],y:p[1],t:performance.now()}); runLaser(); return; }
  }
  function onUp(e){
    const p=pos(e);
    if(touches.has(e.pointerId)){
      touches.delete(e.pointerId);
      if(gesture && gesture.type==='pinch'){ if(touches.size===1){ const t=[...touches.entries()][0]; gesture={type:'pan', id:t[0], last:t[1].p}; } else if(!touches.size) gesture=null; }
      else if(gesture && gesture.id===e.pointerId) gesture=null;
      if(!touches.size && tap){ const quick=performance.now()-tap.t0<320 && !tap.moved; if(quick && P.gestures){ if(tap.max===2) undo(); else if(tap.max===3) redo(); } tap=null; }
      if(!act || act.id!==e.pointerId) return;
    }
    if(gesture && gesture.id===e.pointerId){ gesture=null; return; }
    if(!act || act.id!==e.pointerId) return;
    const a=act; act=null; if(a.ptype==='pen') lastPenUp=performance.now();
    if(a.kind==='stroke'){ clearTimeout(a.holdT); finishStroke(); }
    else if(a.kind==='erase'){ if(!a.erased) hist.pop(); clearInk(); if(a.erased){ changed(); } }
    else if(a.kind==='lasso'){ finishLasso(a); }
    else if(a.kind==='tap-stamp'){ if(!a.moved) stampMenu(a.hit,p); }
    else if(a.kind==='tap-text'){ if(!a.moved){ const hitT=textAt(a.w); editText(hitT, a.w[0], a.w[1]); } }
  }
  function cancelAct(){ if(act && act.holdT) clearTimeout(act.holdT); act=null; cur=null; clearInk(); }
  function finishStroke(){
    if(!cur) return; const st=cur; cur=null;
    if(st.forceShape && !st.snapped){ const sh=recognizeShape(st.pts); if(sh){ let ps=0,n=0; for(let i=2;i<st.pts.length;i+=3){ps+=st.pts[i];n++;} st.pts=shapeToPts(sh, Math.max(0.45,ps/n)); } }
    if(st.tool==='hl' && P.hl.straight && !st.snapped) st.pts=straightPts(st.pts);
    delete st.forceShape; delete st.snapped;
    if(mode==='pages'){ const pg=pageAt(st.pts[0],st.pts[1]); if(pg) st.pg=pg; }
    snap(); strokes=strokes.concat([st]);
    setCacheTransform(); drawStroke(cctx, st); compose(); clearInk(); changed();
  }

  /* ---------- gomme ---------- */
  function eraseAt(p){
    const w=toW(p[0],p[1]), r=P.eraser.size/2/view.s;
    if(!act.snapped){ snap(); act.snapped=true; }
    let hitBox=null, out=null;
    const grow=b=>{ hitBox = hitBox ? {x:Math.min(hitBox.x,b[0]),y:Math.min(hitBox.y,b[1]),w:Math.max(hitBox.x+hitBox.w,b[2])-Math.min(hitBox.x,b[0]),h:Math.max(hitBox.y+hitBox.h,b[3])-Math.min(hitBox.y,b[1])} : {x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1]}; };
    if(P.eraser.mode==='stroke'){
      out=[]; for(const st of strokes){ if((!P.eraser.hlOnly||st.tool==='hl') && hitStroke(st,w[0],w[1],r)){ grow(strokeBox(st)); } else out.push(st); }
    } else {
      out=[]; for(const st of strokes){ if(P.eraser.hlOnly && st.tool!=='hl'){ out.push(st); continue; } const sp=splitStroke(st,w[0],w[1],r); if(sp===null) out.push(st); else { grow(strokeBox(st)); out.push(...sp); } }
    }
    if(hitBox){ strokes=out; act.erased=true; renderRect(hitBox); compose(); quietDirty(); }
    clearInk(); ictx.setTransform(dpr,0,0,dpr,0,0); ictx.beginPath(); ictx.arc(p[0],p[1],P.eraser.size/2,0,Math.PI*2); ictx.fillStyle='rgba(255,255,255,.55)'; ictx.fill(); ictx.lineWidth=1.5; ictx.strokeStyle='#16182a'; ictx.stroke();
  }

  /* ---------- lasso & sélection ---------- */
  function drawLasso(){ clearInk(); if(!act||!act.scr) return; ictx.setTransform(dpr,0,0,dpr,0,0); ictx.beginPath(); act.scr.forEach((q,i)=>i?ictx.lineTo(q[0],q[1]):ictx.moveTo(q[0],q[1])); ictx.closePath(); ictx.fillStyle='rgba(29,47,160,.07)'; ictx.fill(); ictx.setLineDash([6,5]); ictx.lineWidth=1.6; ictx.strokeStyle='#1d2fa0'; ictx.stroke(); ictx.setLineDash([]); }
  function finishLasso(a){
    clearInk(); if(a.poly.length<3){ setSel(null); return; }
    const poly=a.poly, set=new Set();
    let bx0=Infinity,by0=Infinity,bx1=-Infinity,by1=-Infinity; for(const q of poly){ bx0=Math.min(bx0,q[0]); bx1=Math.max(bx1,q[0]); by0=Math.min(by0,q[1]); by1=Math.max(by1,q[1]); }
    for(const st of strokes){ const b=strokeBox(st); if(b[2]<bx0||b[0]>bx1||b[3]<by0||b[1]>by1) continue; const pts=st.pts; let inside=0, n=0; for(let i=0;i<pts.length;i+=3){ n++; if(pointInPoly(pts[i],pts[i+1],poly)) inside++; } if(inside>=Math.max(1,n*0.5)) set.add(st); }
    for(const it of items){ if(it.kind==='page') continue; const b=itemBox(it); if(pointInPoly(b.x+b.w/2,b.y+b.h/2,poly)) set.add(it); }
    setSel(set.size?set:null);
  }
  const selEl=el('div',{class:'sel-box',style:{display:'none'}}); const handle=el('div',{class:'sel-handle',title:'Redimensionner'}); selEl.append(handle);
  const selBar=el('div',{class:'sel-bar',style:{display:'none'}});
  function setSel(set){ sel=set?{set}:null; buildSelBar(); placeOverlays(); }
  function selParts(){ return {ss:strokes.filter(s=>sel.set.has(s)), ii:items.filter(i=>sel.set.has(i))}; }
  function selBounds(){ if(!sel) return null; const {ss,ii}=selParts(); return unionBox(ss,ii); }
  function buildSelBar(){
    selBar.replaceChildren(); if(!sel) return;
    const colBtn=el('button',{type:'button',class:'btn small',text:'Couleur',onclick:()=>{ openPop(colBtn, el('div',{class:'pop-swatches'}, PEN_COLORS.concat(HL_COLORS).map(c=>el('button',{type:'button',class:'swatch',style:{background:c},'aria-label':'Couleur',onclick:()=>{ recolor(c); closePop(); }})))); }});
    selBar.append(colBtn,
      el('button',{type:'button',class:'btn small',text:'Dupliquer',onclick:()=>duplicateSel()}),
      el('button',{type:'button',class:'btn small',text:'Copier',onclick:()=>{ copySel(); toast('Copié'); }}),
      el('button',{type:'button',class:'btn small',text:'Couper',onclick:()=>{ copySel(); deleteSel(); }}),
      el('button',{type:'button',class:'btn small',text:'→ Carnet',onclick:async()=>{ const b=selBounds(); if(b) await sendRegionToReplay(node, scene(), {x:b.x-24,y:b.y-24,w:b.w+48,h:b.h+48}); }}),
      el('button',{type:'button',class:'btn small danger',text:'Supprimer',onclick:()=>deleteSel()}),
      el('button',{type:'button',class:'btn small ghost',text:'✕','aria-label':'Désélectionner',onclick:()=>setSel(null)}));
  }
  function recolor(c){ if(!sel) return; snap(); const ns=new Set();
    strokes=strokes.map(s=>{ if(!sel.set.has(s)) return s; const n=Object.assign({},s,{color:c}); ns.add(n); return n; });
    items=items.map(i=>{ if(!sel.set.has(i)) return i; if(i.kind!=='text'){ ns.add(i); return i; } const n=Object.assign({},i,{color:c}); ns.add(n); return n; });
    sel.set=ns; changed(); invalidate(); }
  function cloneObjs(ss, ii, dx, dy){
    const ns=ss.map(s=>{ const a=s.pts.slice(); for(let i=0;i<a.length;i+=3){ a[i]=r1(a[i]+dx); a[i+1]=r1(a[i+1]+dy); } return Object.assign({},s,{id:uid(),pts:a}); });
    const ni=ii.map(i=>Object.assign({},i,{id:uid(),x:i.x+dx,y:i.y+dy,done:false}));
    return {ns, ni};
  }
  function assignPg(objs){ if(mode!=='pages') return; for(const o of objs){ const b=o.pts?strokeBox(o):null; const cx=b?(b[0]+b[2])/2:o.x, cy=b?(b[1]+b[3])/2:o.y; o.pg=pageAt(cx,cy)||undefined; } }
  function duplicateSel(){ if(!sel) return; snap(); const {ss,ii}=selParts(); const {ns,ni}=cloneObjs(ss,ii,30,30); assignPg(ns.concat(ni)); strokes=strokes.concat(ns); items=items.concat(ni); sel.set=new Set([...ns,...ni]); changed(); invalidate(); }
  function copySel(){ if(!sel) return; const {ss,ii}=selParts(); NB.clip={strokes:clone(ss), items:clone(ii), box:selBounds()}; }
  function deleteSel(){ if(!sel) return; snap(); strokes=strokes.filter(s=>!sel.set.has(s)); items=items.filter(i=>!sel.set.has(i)); setSel(null); changed(); invalidate(); }
  function paste(){
    const c=NB.clip; if(!c) return toast('Rien à coller'); snap();
    const [cx,cy]=toW(W/2,H/2); const dx=cx-(c.box.x+c.box.w/2), dy=cy-(c.box.y+c.box.h/2);
    const {ns,ni}=cloneObjs(c.strokes, c.items, dx, dy); assignPg(ns.concat(ni)); strokes=strokes.concat(ns); items=items.concat(ni); setSel(new Set([...ns,...ni])); changed(); invalidate();
  }
  /* déplacer / redimensionner : aperçu sur la couche d'encre, puis application */
  let tr=null;
  function selPointer(e, kind){
    e.stopPropagation(); e.preventDefault(); if(!sel) return; closePop();
    const p=pos(e), b=selBounds(); tr={kind, id:e.pointerId, start:toW(p[0],p[1]), anchor:[b.x,b.y], b, dx:0, dy:0, f:1};
    try{ e.target.setPointerCapture(e.pointerId); }catch(_){}
    hidden=sel.set; renderCache(); compose(); previewSel();
  }
  function selMove(e){ if(!tr||e.pointerId!==tr.id) return; const w=toW(...pos(e));
    if(tr.kind==='move'){ tr.dx=w[0]-tr.start[0]; tr.dy=w[1]-tr.start[1]; }
    else { const d0=Math.hypot(tr.start[0]-tr.anchor[0],tr.start[1]-tr.anchor[1])||1, d1=Math.hypot(w[0]-tr.anchor[0],w[1]-tr.anchor[1]); tr.f=Math.max(0.1,Math.min(8,d1/d0)); }
    previewSel(); placeOverlays(); }
  function previewSel(){
    clearInk(); if(!tr) return; inkWorld(); ictx.save();
    if(tr.kind==='move') ictx.translate(tr.dx,tr.dy); else { ictx.translate(tr.anchor[0],tr.anchor[1]); ictx.scale(tr.f,tr.f); ictx.translate(-tr.anchor[0],-tr.anchor[1]); }
    const {ss,ii}=selParts(); drawScene(ictx,{mode:'none',strokes:ss,items:ii},{s:view.s*(tr.f||1),dpr,vis:[-1e9,-1e9,1e9,1e9],onAsset:previewSel}); ictx.restore();
  }
  function selUp(e){
    if(!tr||e.pointerId!==tr.id) return; const t=tr; tr=null; hidden=null; clearInk();
    const moved = t.kind==='move' ? Math.abs(t.dx)+Math.abs(t.dy)>0.5 : Math.abs(t.f-1)>0.01;
    if(moved){ snap(); const ns=new Set(); const [ax,ay]=t.anchor, f=t.f;
      const T = t.kind==='move' ? ((x,y)=>[x+t.dx,y+t.dy]) : ((x,y)=>[ax+(x-ax)*f, ay+(y-ay)*f]);
      strokes=strokes.map(s=>{ if(!sel.set.has(s)) return s; const a=s.pts.slice(); for(let i=0;i<a.length;i+=3){ const q=T(a[i],a[i+1]); a[i]=r1(q[0]); a[i+1]=r1(q[1]); } const n=Object.assign({},s,{pts:a, size:t.kind==='move'?s.size:s.size*f}); ns.add(n); return n; });
      items=items.map(i=>{ if(!sel.set.has(i)) return i; const q=T(i.x,i.y); const n=Object.assign({},i,{x:q[0],y:q[1]}); if(t.kind==='scale'){ if(i.w) n.w=i.w*f; if(i.h) n.h=i.h*f; if(i.kind==='text') n.size=i.size*f; } ns.add(n); return n; });
      assignPg([...ns]); sel.set=ns; changed();
    }
    invalidate();
  }
  selEl.addEventListener('pointerdown',e=>{ if(e.target===handle) return; selPointer(e,'move'); });
  handle.addEventListener('pointerdown',e=>selPointer(e,'scale'));
  for(const t of [selEl,handle]){ t.addEventListener('pointermove',selMove); t.addEventListener('pointerup',selUp); t.addEventListener('pointercancel',selUp); }

  /* ---------- texte ---------- */
  function textAt(w){ for(let i=items.length-1;i>=0;i--){ const it=items[i]; if(it.kind!=='text') continue; const b=textBox(it); if(w[0]>=b.x-6&&w[0]<=b.x+b.w+6&&w[1]>=b.y-6&&w[1]<=b.y+b.h+6) return it; } return null; }
  function editText(it, wx, wy){
    finishText(); const T=P.text;
    const base0=it||{id:uid(), kind:'text', x:wx, y:wy-T.size*0.6, w:Math.max(160,Math.min(620,(W*0.55)/view.s)), text:'', size:T.size, color:T.color, font:T.font};
    if(it){ hidden=new Set([it]); invalidate(); }
    const ta=el('textarea',{class:'ed-text', spellcheck:'true', placeholder:'Écris ici…'}); ta.value=base0.text||'';
    textEd={it, base:base0, ta}; wrap.append(ta); placeOverlays();
    const grow=()=>{ ta.style.height='auto'; ta.style.height=(ta.scrollHeight+2)+'px'; };
    ta.addEventListener('input',grow); ta.addEventListener('blur',()=>setTimeout(finishText,0)); ta.addEventListener('pointerdown',e=>e.stopPropagation());
    setTimeout(()=>{ ta.focus(); grow(); },20);
  }
  function finishText(){
    if(!textEd) return; const {it, base:b, ta}=textEd; textEd=null; const txt=ta.value.replace(/\s+$/,''); ta.remove(); hidden=null;
    if(it){ if(txt!==it.text){ snap(); items = txt ? items.map(x=>x===it?Object.assign({},it,{text:txt}):x) : items.filter(x=>x!==it); changed(); } }
    else if(txt){ snap(); const n=Object.assign({},b,{text:txt}); if(mode==='pages'){ const pg=pageAt(n.x,n.y); if(pg) n.pg=pg; } items=items.concat([n]); changed(); }
    invalidate();
  }

  /* ---------- tampons ---------- */
  function stampAt(p){ for(let i=items.length-1;i>=0;i--){ const it=items[i]; if(it.kind!=='stamp') continue; const [x,y]=toS(it.x,it.y); const r=16/Math.max(0.35,Math.min(view.s,2.5))*view.s*1.3+6; if((x-p[0])**2+(y-p[1])**2<=r*r) return it; } return null; }
  function addStamp(w){ snap(); const it={id:uid(),kind:'stamp',stamp:stampType,x:w[0],y:w[1],done:false}; if(mode==='pages'){ const pg=pageAt(w[0],w[1]); if(pg) it.pg=pg; } items=items.concat([it]); changed(); invalidate(); buzz(8); }
  function stampMenu(it, p){
    const st=STAMP[it.stamp]||STAMP.q;
    const box=el('div',{class:'pop-menu'}, el('div',{class:'small',style:{fontWeight:700,margin:'2px 4px 6px'},text:st.name}),
      it.stamp==='q'? el('button',{type:'button',class:'btn small',text:it.done?'Marquer « pas résolu »':'Résolu ✓',onclick:()=>{ snap(); const was=it.done; items=items.map(x=>x===it?Object.assign({},it,{done:!it.done}):x); changed(); invalidate(); closePop(); if(!was) xpToast(10,nbCourseOf(node)||'Cours'); }}):'',
      el('button',{type:'button',class:'btn small',text:'→ Carnet Replay',onclick:async()=>{ closePop(); await sendRegionToReplay(node, scene(), stampRect(it)); }}),
      el('button',{type:'button',class:'btn small danger',text:'Supprimer',onclick:()=>{ snap(); items=items.filter(x=>x!==it); changed(); invalidate(); closePop(); }}));
    openPopAt(box, p[0]+16, p[1]+8);
  }

  /* ---------- laser ---------- */
  function runLaser(){ if(laserRaf) return; const tick=()=>{ laserRaf=0; const now=performance.now(); laser=laser.filter(q=>now-q.t<650); clearInk(); if(cur) drawLive(); ictx.setTransform(dpr,0,0,dpr,0,0);
      if(laser.length>1){ ictx.lineCap='round'; ictx.lineJoin='round'; for(let i=1;i<laser.length;i++){ const a=laser[i-1], b=laser[i]; const age=(now-b.t)/650; ictx.strokeStyle=`rgba(255,40,60,${(1-age)*0.9})`; ictx.lineWidth=6*(1-age)+2; ictx.shadowColor='rgba(255,40,60,.8)'; ictx.shadowBlur=12; ictx.beginPath(); ictx.moveTo(a.x,a.y); ictx.lineTo(b.x,b.y); ictx.stroke(); } ictx.shadowBlur=0; }
      if(laser.length) laserRaf=requestAnimationFrame(tick); else clearInk(); };
    laserRaf=requestAnimationFrame(tick); }

  /* ---------- petits menus flottants ---------- */
  function openPopAt(content, x, y){ closePop(); pop=el('div',{class:'pop'}, content); wrap.append(pop); const r=pop.getBoundingClientRect(); pop.style.left=Math.max(6,Math.min(W-r.width-6,x))+'px'; pop.style.top=Math.max(6,Math.min(H-r.height-6,y))+'px'; }
  function openPop(anchor, content){ closePop(); pop=el('div',{class:'pop'}, content); root.append(pop); const a=anchor.getBoundingClientRect(), r=pop.getBoundingClientRect(); pop.style.position='fixed'; pop.style.left=Math.max(6,Math.min(window.innerWidth-r.width-6,a.left))+'px'; pop.style.top=(a.bottom+6)+'px'; }
  function closePop(){ if(pop){ pop.remove(); pop=null; } }

  /* ---------- superpositions DOM ---------- */
  const pageChip=el('button',{type:'button',class:'page-chip',onclick:()=>togglePanel(true)});
  function placeOverlays(){
    if(sel){ let b=selBounds(); if(b && tr){ if(tr.kind==='move') b={x:b.x+tr.dx,y:b.y+tr.dy,w:b.w,h:b.h}; else b={x:tr.anchor[0]+(b.x-tr.anchor[0])*tr.f,y:tr.anchor[1]+(b.y-tr.anchor[1])*tr.f,w:b.w*tr.f,h:b.h*tr.f}; }
      if(b){ const [x,y]=toS(b.x,b.y); const pad=10; selEl.style.display='block'; Object.assign(selEl.style,{left:(x-pad)+'px',top:(y-pad)+'px',width:(b.w*view.s+2*pad)+'px',height:(b.h*view.s+2*pad)+'px'});
        selBar.style.display=tr?'none':'flex'; const bw=selBar.offsetWidth||420; selBar.style.left=Math.max(6,Math.min(W-bw-6,x))+'px'; selBar.style.top=(y-pad-54<6? y+b.h*view.s+pad+8 : y-pad-54)+'px'; }
    } else { selEl.style.display='none'; selBar.style.display='none'; }
    if(textEd){ const b=textEd.base; const [x,y]=toS(b.x,b.y); Object.assign(textEd.ta.style,{left:x+'px',top:y+'px',width:(b.w*view.s)+'px',fontSize:(b.size*view.s)+'px',color:b.color,fontFamily:TEXT_FONTS[b.font]||TEXT_FONTS.sans}); }
    if(mode==='pages'){ const ps=pagesSorted(), c=currentPage(); pageChip.style.display=ps.length?'block':'none'; pageChip.textContent=(c?ps.indexOf(c)+1:1)+' / '+ps.length; }
    else pageChip.style.display='none';
  }

  /* ---------- panneau des pages / repères ---------- */
  const panel=el('div',{class:'ed-side',style:{display:'none'}});
  let panelTab=mode==='pages'?'pages':'marks';
  const thumbCache=new Map();
  function togglePanel(force){ const show=force!==undefined?force:panel.style.display==='none'; panel.style.display=show?'flex':'none'; if(show) refreshPanel(); }
  function refreshPanel(){
    if(panel.style.display==='none') return;
    const tabs=el('div',{class:'seg seg-sm'}, mode==='pages'?el('button',{type:'button',class:panelTab==='pages'?'on':'',text:'Pages',onclick:()=>{ panelTab='pages'; refreshPanel(); }}):'',
      el('button',{type:'button',class:panelTab==='bm'?'on':'',text:'Marque-pages',onclick:()=>{ panelTab='bm'; refreshPanel(); },style:{display:mode==='pages'?'':'none'}}),
      el('button',{type:'button',class:panelTab==='marks'?'on':'',text:'Repères',onclick:()=>{ panelTab='marks'; refreshPanel(); }}));
    const head=el('div',{class:'row',style:{gap:'6px'}}, tabs, el('span',{class:'spacer'}), el('button',{type:'button',class:'btn small ghost','aria-label':'Fermer',text:'✕',onclick:()=>togglePanel(false)}));
    const list=el('div',{class:'side-list'});
    if(panelTab==='marks'){
      const st=items.filter(i=>i.kind==='stamp');
      if(!st.length) list.append(el('p',{class:'muted small',text:'Pose des tampons ?, ★ ou ƒ pour retrouver les passages importants ici.'}));
      st.forEach(it=>{ const S2=STAMP[it.stamp]||STAMP.q, d=it.stamp==='q'&&it.done; list.append(el('button',{type:'button',class:'side-li',onclick:()=>{ view.s=Math.max(view.s,1); view.tx=W*0.3-it.x*view.s; view.ty=H/2-it.y*view.s; viewMoved(); invalidate(); }}, el('span',{class:'stamp-ic',style:{background:d?'#1d8a4e':S2.color},text:d?'✓':S2.label}), el('span',{text:S2.name+(d?' (résolu)':'')}))); });
    } else {
      const ps=pagesSorted().filter(p=>panelTab==='pages'||p.bm);
      if(!ps.length) list.append(el('p',{class:'muted small',text:panelTab==='bm'?'Aucun marque-page. Ouvre le menu ⋯ d’une page pour en ajouter un.':'Aucune page.'}));
      const all=pagesSorted();
      ps.forEach(pg=>{ const idx=all.indexOf(pg)+1; const cvs=el('canvas',{class:'pthumb-c'});
        const key=pg.id+':'+hist.length+':'+strokes.length+':'+items.length;
        const paint=bmp=>{ cvs.width=bmp.width; cvs.height=bmp.height; cvs.getContext('2d').drawImage(bmp,0,0); };
        if(thumbCache.has(key)) paint(thumbCache.get(key)); else renderRegion(scene(),{x:pg.x,y:pg.y,w:pg.w,h:pg.h},150,{canvas:true,bg:'#fff'}).then(c=>{ thumbCache.set(key,c); paint(c); });
        const cur0=currentPage();
        list.append(el('div',{class:'pthumb'+(cur0&&cur0.id===pg.id?' on':'')},
          el('button',{type:'button',class:'pthumb-btn',onclick:()=>goPage(pg)}, cvs, pg.bm?el('span',{class:'pthumb-bm'}):''),
          el('div',{class:'row',style:{justifyContent:'space-between',marginTop:'4px'}}, el('span',{class:'small',text:'Page '+idx}),
            el('button',{type:'button',class:'btn small ghost','aria-label':'Options de la page',text:'⋯',onclick:ev=>pageMenu(pg,ev.currentTarget)}))));
      });
      if(panelTab==='pages') list.append(el('button',{type:'button',class:'btn',style:{width:'100%',marginTop:'8px'},text:'＋ Page à la fin',onclick:()=>addPage((all[all.length-1]||{}).id)}));
    }
    panel.replaceChildren(head, list);
  }
  function pageMenu(pg, anchor){
    const box=el('div',{class:'pop-menu'},
      el('button',{type:'button',class:'btn small',text:'＋ Page après',onclick:()=>{ closePop(); addPage(pg.id); }}),
      el('button',{type:'button',class:'btn small',text:'Dupliquer',onclick:()=>{ closePop(); dupPage(pg.id); }}),
      el('button',{type:'button',class:'btn small',text:'Monter',onclick:()=>{ closePop(); movePage(pg.id,-1); }}),
      el('button',{type:'button',class:'btn small',text:'Descendre',onclick:()=>{ closePop(); movePage(pg.id,1); }}),
      el('button',{type:'button',class:'btn small',text:pg.bm?'Retirer le marque-page':'Marque-page',onclick:()=>{ closePop(); setPageProp(pg.id,{bm:!pg.bm}); }}),
      !pg.img? el('button',{type:'button',class:'btn small',text:'Modèle…',onclick:()=>{ closePop(); templatePicker(t=>setPageProp(pg.id,{tpl:t}), pg.tpl); }}):'',
      el('button',{type:'button',class:'btn small',text:'→ Carnet Replay',onclick:async()=>{ closePop(); await sendRegionToReplay(node, scene(), {x:pg.x,y:pg.y,w:pg.w,h:pg.h}); }}),
      el('button',{type:'button',class:'btn small danger',text:'Supprimer',onclick:()=>{ closePop(); delPage(pg.id); }}));
    openPop(anchor, box);
  }
  function templatePicker(cb, curTpl){
    let close;
    const grid=el('div',{class:'tpl-grid'}, TPLS.map(([id,label])=>{ const c=el('canvas',{width:120,height:150,class:'tpl-c'}); const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,120,150); x.setTransform(0.12,0,0,0.12,0,0); drawTpl(x,id,{x:0,y:0,w:1000,h:1414},0.12*2.2,[0,0,1000,1414],false);
      return el('button',{type:'button',class:'tpl'+(id===curTpl?' on':''),onclick:()=>{ close(); cb(id); }}, c, el('span',{class:'small',text:label})); }));
    close=modal(el('div',{}, el('h3',{text:'Modèle de page'}), grid, el('div',{class:'row',style:{marginTop:'12px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>close()}))));
  }

  /* ---------- barre d'outils ---------- */
  const tb={};
  const tbtn=(id,ic,label)=>{ const b=el('button',{type:'button',class:'tb','aria-label':label,title:label,onclick:()=>setTool(id)}, icon(ic)); tb[id]=b; return b; };
  const sub=el('div',{class:'ed-sub'});
  function setTool(t){ finishText(); if(t!=='lasso') setSel(null); tool=t; for(const k in tb) tb[k].classList.toggle('on',k===t); buildSub(); ink.style.cursor = t==='hand'?'grab':(t==='text'?'text':'crosshair'); }
  function sizeDots(arr, curv, onPick, kind){ return el('div',{class:'sizes'}, arr.map((v,i)=>el('button',{type:'button',class:'size'+(Math.abs(curv-v)<1e-6?' on':''),'aria-label':'Taille '+(i+1),onclick:()=>{ onPick(v); buildSub(); }}, el('i',{style:{width:(kind==='hl'?6+i*5:kind==='er'?6+i*6:4+i*4)+'px',height:(kind==='hl'?6+i*5:kind==='er'?6+i*6:4+i*4)+'px'}})))); }
  function swatches(cols, curc, onPick){
    const wrapS=el('div',{class:'swatches'}, cols.map(c=>el('button',{type:'button',class:'swatch'+(c===curc?' on':''),style:{background:c},'aria-label':'Couleur',onclick:()=>{ onPick(c); buildSub(); }})));
    const custom=el('input',{type:'color',class:'swatch-custom',value:/^#[0-9a-f]{6}$/i.test(curc)?curc:'#1d2fa0',title:'Autre couleur','aria-label':'Autre couleur'});
    custom.addEventListener('change',()=>{ onPick(custom.value); const r=P.recent; if(!r.includes(custom.value)){ r.unshift(custom.value); r.length=Math.min(r.length,4); } inkPrefsChanged(); buildSub(); });
    (P.recent||[]).forEach(c=>{ if(!cols.includes(c)) wrapS.append(el('button',{type:'button',class:'swatch'+(c===curc?' on':''),style:{background:c},'aria-label':'Couleur récente',onclick:()=>{ onPick(c); buildSub(); }})); });
    wrapS.append(custom); return wrapS;
  }
  const seg=(opts, curv, onPick)=>el('div',{class:'seg seg-sm'}, opts.map(([v,l])=>el('button',{type:'button',class:v===curv?'on':'',text:l,onclick:()=>{ onPick(v); buildSub(); }})));
  const toggle=(label, on, onFlip)=>el('button',{type:'button',class:'chip chip-sm'+(on?' on':''),text:label,onclick:()=>{ onFlip(); buildSub(); }});
  const fingerBtn=el('button',{type:'button',class:'tb tb-sm','aria-label':'Dessiner au doigt',title:'Dessiner au doigt',onclick:()=>{ P.finger=!P.finger; inkPrefsChanged(); toast(P.finger?'Le doigt dessine':'Le doigt fait défiler'); buildSub(); }}, icon('finger'));
  const countBtn=el('button',{type:'button',class:'btn small ghost',onclick:()=>{ panelTab='marks'; togglePanel(true); }});
  function updateCounts(){ const q=items.filter(i=>i.kind==='stamp'&&i.stamp==='q'&&!i.done).length, all=items.filter(i=>i.kind==='stamp').length; countBtn.textContent='Repères '+all+(q?' · '+q+' ?':''); placeOverlays(); refreshPanelLight(); }
  let panelT=0; function refreshPanelLight(){ clearTimeout(panelT); panelT=setTimeout(refreshPanel,400); }
  function buildSub(){
    const ch=[];
    const save=()=>inkPrefsChanged();
    if(tool==='pen'){ ch.push(seg(Object.entries(PENS).map(([k,v])=>[k,v.name]), P.pen.type, v=>{ P.pen.type=v; save(); }), sizeDots(PEN_SIZES,P.pen.size,v=>{ P.pen.size=v; save(); }), swatches(PEN_COLORS,P.pen.color,c=>{ P.pen.color=c; save(); })); ch.push(el('span',{class:'ed-hint small',text:'Maintiens le stylet à la fin d’un trait pour le redresser'})); }
    else if(tool==='hl'){ ch.push(sizeDots(HL_SIZES,P.hl.size,v=>{ P.hl.size=v; save(); },'hl'), swatches(HL_COLORS,P.hl.color,c=>{ P.hl.color=c; save(); }), toggle('Trait droit',P.hl.straight,()=>{ P.hl.straight=!P.hl.straight; save(); })); }
    else if(tool==='eraser'){ ch.push(seg([['stroke','Trait entier'],['precise','Précise']],P.eraser.mode,v=>{ P.eraser.mode=v; save(); }), sizeDots(ER_SIZES,P.eraser.size,v=>{ P.eraser.size=v; save(); },'er'), toggle('Surligneur seulement',P.eraser.hlOnly,()=>{ P.eraser.hlOnly=!P.eraser.hlOnly; save(); })); }
    else if(tool==='lasso') ch.push(el('span',{class:'ed-hint',text:'Entoure ce que tu veux déplacer, agrandir, recolorer ou copier.'}), NB.clip?el('button',{type:'button',class:'btn small',text:'Coller',onclick:paste}):'');
    else if(tool==='shape') ch.push(sizeDots(PEN_SIZES,P.pen.size,v=>{ P.pen.size=v; save(); }), swatches(PEN_COLORS,P.pen.color,c=>{ P.pen.color=c; save(); }), el('span',{class:'ed-hint small',text:'Dessine un trait, un cercle, un triangle ou un rectangle : il se redresse.'}));
    else if(tool==='text') ch.push(seg([['16','Petit'],['22','Moyen'],['32','Grand']],String(P.text.size),v=>{ P.text.size=+v; save(); }), seg([['sans','Normal'],['hand','Manuscrit'],['serif','Serif']],P.text.font,v=>{ P.text.font=v; save(); }), swatches(PEN_COLORS,P.text.color,c=>{ P.text.color=c; save(); }), el('span',{class:'ed-hint small',text:'Touche la page pour écrire.'}));
    else if(tool==='laser') ch.push(el('span',{class:'ed-hint',text:'Pointeur laser : la trace s’efface toute seule.'}));
    else if(tool==='stamp') ch.push(seg([['q','? Pas compris'],['star','★ Important'],['f','ƒ Formule']],stampType,v=>{ stampType=v; }), el('span',{class:'ed-hint small',text:'Touche la marge pour poser le tampon.'}));
    else if(tool==='hand') ch.push(el('span',{class:'ed-hint',text:'Fais glisser pour te déplacer. Pince pour zoomer.'}));
    fingerBtn.classList.toggle('on',!!P.finger);
    sub.replaceChildren(el('div',{class:'sub-left'},ch), el('span',{class:'spacer'}), fingerBtn, countBtn);
  }
  const fileImg=el('input',{type:'file',accept:'image/*',style:{display:'none'}}), fileCam=el('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'}}), filePdf=el('input',{type:'file',accept:'application/pdf,.pdf',style:{display:'none'}});
  async function insertImage(f){
    if(!f) return; let blob; try{ blob=await recompress(f,2200,0.88,'image/jpeg'); }catch(e){ blob=f; }
    const bmp=await createImageBitmap(blob).catch(()=>null); const ar=bmp?bmp.height/bmp.width:0.75; if(bmp) bmp.close();
    const key=await putBlob(blob); const w=Math.min(W*0.6,720)/view.s; const [cx,cy]=toW(W/2,H/2);
    snap(); const it={id:uid(),kind:'img',img:key,x:cx-w/2,y:cy-w*ar/2,w,h:w*ar}; if(mode==='pages'){ const pg=pageAt(cx,cy); if(pg) it.pg=pg; }
    items=items.concat([it]); changed(); invalidate(); setTool('lasso'); setSel(new Set([it]));
  }
  fileImg.addEventListener('change',()=>{ insertImage(fileImg.files[0]); fileImg.value=''; });
  fileCam.addEventListener('change',()=>{ insertImage(fileCam.files[0]); fileCam.value=''; });
  filePdf.addEventListener('change',async()=>{ const f=filePdf.files[0]; filePdf.value=''; if(!f) return; const pages=await pdfToPages(f); if(!pages.length) return;
    snap();
    if(mode==='pages'){ const ps=pagesSorted(); const c=currentPage(); const i=c?ps.indexOf(c):ps.length-1; ps.splice(i+1,0,...pages); relayout(ps); goPage(items.find(p=>p.id===pages[0].id)); }
    else { const b=unionBox(strokes,items); let y=b?b.y+b.h+80:0; for(const pg of pages){ pg.x=0; pg.y=y; y+=pg.h+PAGE_GAP; } items=items.concat(pages); view.s=Math.min(1.2,(W-60)/1000); view.tx=30; view.ty=30-pages[0].y*view.s; viewMoved(); }
    changed(); invalidate(); refreshPanel(); toast(pages.length+' page'+(pages.length>1?'s':'')+' importée'+(pages.length>1?'s':'')); });
  const titleBtn=el('button',{type:'button',class:'ed-title',text:node.name,title:'Renommer',onclick:async()=>{ const v=await promptBox('Nom de la note',node.name); if(v){ node.name=v; titleBtn.textContent=v; await nbSaveNode(node); } }});
  const insertBtn=el('button',{type:'button',class:'tb','aria-label':'Insérer',title:'Insérer'}, icon('plus'));
  insertBtn.addEventListener('click',()=>openPop(insertBtn, el('div',{class:'pop-menu'},
    mode==='pages'? el('button',{type:'button',class:'btn small',onclick:()=>{ closePop(); const c=currentPage(); addPage(c&&c.id); }}, icon('page'),' Nouvelle page'):'',
    el('button',{type:'button',class:'btn small',onclick:()=>{ closePop(); fileImg.click(); }}, icon('image'),' Image'),
    el('button',{type:'button',class:'btn small',onclick:()=>{ closePop(); fileCam.click(); }}, icon('camera'),' Photo'),
    el('button',{type:'button',class:'btn small',onclick:()=>{ closePop(); filePdf.click(); }}, icon('pdf'),' PDF'),
    el('button',{type:'button',class:'btn small',disabled:!NB.clip,onclick:()=>{ closePop(); paste(); }}, icon('paste'),' Coller'))));
  const moreBtn=el('button',{type:'button',class:'tb','aria-label':'Plus',title:'Plus'}, icon('more'));
  moreBtn.addEventListener('click',()=>openPop(moreBtn, el('div',{class:'pop-menu'},
    el('button',{type:'button',class:'btn small',text:mode==='pages'?'Modèle de la page…':'Fond du tableau…',onclick:()=>{ closePop(); if(mode==='pages'){ const c=currentPage(); if(c&&!c.img) templatePicker(t=>setPageProp(c.id,{tpl:t}),c.tpl); else toast('Cette page est un PDF.'); } else templatePicker(t=>{ doc.tpl=t; changed(); invalidate(); }, doc.tpl); }}),
    mode==='pages'? el('button',{type:'button',class:'btn small',text:'Appliquer ce modèle à tout le cahier',onclick:()=>{ closePop(); const c=currentPage(); if(!c) return; snap(); items=items.map(p=>p.kind==='page'&&!p.img?Object.assign({},p,{tpl:c.tpl}):p); doc.tpl=c.tpl; changed(); invalidate(); }}):'',
    el('button',{type:'button',class:'btn small',text:'Exporter en PDF',onclick:async()=>{ closePop(); await save(); exportNotePdf(node); }}),
    el('button',{type:'button',class:'btn small',text:S.edFull?'Quitter le plein écran':'Plein écran',onclick:()=>{ closePop(); toggleFull(); }}),
    el('button',{type:'button',class:'btn small',text:(P.penButton?'✓ ':'')+'Bouton du stylet = gomme',onclick:()=>{ P.penButton=!P.penButton; inkPrefsChanged(); closePop(); }}),
    el('button',{type:'button',class:'btn small',text:(P.gestures?'✓ ':'')+'Toucher à 2 doigts = annuler, 3 = rétablir',onclick:()=>{ P.gestures=!P.gestures; inkPrefsChanged(); closePop(); }}))));
  function toggleFull(){ S.edFull=!S.edFull; root.classList.toggle('full',!!S.edFull); requestAnimationFrame(sizeAll); }
  const pagesBtn=el('button',{type:'button',class:'tb','aria-label':'Pages et repères',title:'Pages et repères',onclick:()=>togglePanel()}, icon('pages'));
  const top=el('div',{class:'ed-top'},
    el('button',{type:'button',class:'tb','aria-label':'Retour',title:'Retour',onclick:()=>close()}, icon('back')), titleBtn,
    el('span',{class:'spacer'}),
    el('div',{class:'tools'}, tbtn('pen','pen','Stylo'), tbtn('hl','hl','Surligneur'), tbtn('eraser','eraser','Gomme'), tbtn('lasso','lasso','Lasso'), tbtn('shape','shape','Formes'), tbtn('text','text','Texte'), tbtn('stamp','stamp','Tampons ? ★ ƒ'), tbtn('laser','laser','Laser'), tbtn('hand','hand','Main')),
    el('span',{class:'spacer'}),
    el('button',{type:'button',class:'tb','aria-label':'Annuler',title:'Annuler',onclick:undo}, icon('undo')),
    el('button',{type:'button',class:'tb','aria-label':'Rétablir',title:'Rétablir',onclick:redo}, icon('redo')),
    pagesBtn, insertBtn, moreBtn, fileImg, fileCam, filePdf);
  const fullBar=el('div',{class:'full-bar'},
    ...[['pen','pen'],['hl','hl'],['eraser','eraser'],['lasso','lasso']].map(([t,i])=>el('button',{type:'button',class:'tb','aria-label':t,onclick:()=>setTool(t)}, icon(i))),
    el('button',{type:'button',class:'tb','aria-label':'Annuler',onclick:undo}, icon('undo')),
    el('button',{type:'button',class:'tb','aria-label':'Quitter le plein écran',onclick:toggleFull}, icon('full')));
  wrap.append(selEl, selBar, pageChip, panel, fullBar);
  root.append(top, sub, wrap);

  /* ---------- événements ---------- */
  ink.addEventListener('pointerdown', onDown);
  ink.addEventListener('pointermove', e=>onMove(e,false));
  if(useRaw) ink.addEventListener('pointerrawupdate', e=>{ if(act && act.kind==='stroke' && act.id===e.pointerId) onMove(e,true); });
  ink.addEventListener('pointerup', onUp); ink.addEventListener('pointercancel', e=>{ if(act && act.id===e.pointerId && act.kind==='stroke'){ cancelAct(); } onUp(e); });
  ink.addEventListener('contextmenu', e=>e.preventDefault());
  ink.addEventListener('wheel', e=>{ e.preventDefault(); const [px,py]=pos(e);
    if(e.ctrlKey||e.metaKey){ const k=Math.exp(-e.deltaY*0.0025); const s=Math.max(0.1,Math.min(10,view.s*k)); const wx=(px-view.tx)/view.s, wy=(py-view.ty)/view.s; view.s=s; view.tx=px-wx*s; view.ty=py-wy*s; }
    else { view.tx-=e.shiftKey?e.deltaY:e.deltaX; view.ty-=e.shiftKey?0:e.deltaY; }
    viewMoved(); }, {passive:false});
  let spaceDown=false;
  function onKey(e){
    if(textEd) return; const k=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&k==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); }
    else if((e.ctrlKey||e.metaKey)&&k==='y'){ e.preventDefault(); redo(); }
    else if((e.ctrlKey||e.metaKey)&&k==='c'&&sel){ copySel(); toast('Copié'); }
    else if((e.ctrlKey||e.metaKey)&&k==='v'&&NB.clip){ e.preventDefault(); paste(); }
    else if((k==='delete'||k==='backspace')&&sel){ e.preventDefault(); deleteSel(); }
    else if(k==='escape'){ setSel(null); closePop(); }
    else if(k===' ') spaceDown=e.type==='keydown';
  }
  window.addEventListener('keydown',onKey); window.addEventListener('keyup',e=>{ if(e.key===' ') spaceDown=false; });

  setTool('pen'); updateCounts();
  function perf(){ const t0=performance.now(); renderCache(); const t1=performance.now(); for(let i=0;i<30;i++){ view.tx+=3; compose(); } const t2=performance.now();
    const long=[]; for(let i=0;i<600;i++) long.push(100+i, 200+Math.sin(i/9)*40, 0.5); cur={tool:'pen',pen:'fountain',size:2.4,color:'#123',pts:long}; const t3=performance.now(); for(let i=0;i<20;i++) drawLive(); const t4=performance.now(); cur=null; clearInk();
    return {renderCache:+(t1-t0).toFixed(1), composeFrame:+((t2-t1)/30).toFixed(2), live600pts:+((t4-t3)/20).toFixed(2)}; }
  return { root, close, perf, flush:()=>save(), debug:()=>({strokes,items,view,cv,hist:hist.length}), start:()=>{
    window.addEventListener('resize',sizeAll); sizeAll();
    if(focus){ view.s=Math.max(1,view.s); view.tx=W*0.3-focus.x*view.s; view.ty=H/2-focus.y*view.s; }
    else if(!doc.view){ if(mode==='pages'){ const pg=pagesSorted()[0]; if(pg){ goPage(pg); } } else { const b=unionBox(strokes,items); if(b){ view.s=Math.min(1.1,(W-60)/Math.max(400,b.w)); view.tx=30-b.x*view.s; view.ty=30-b.y*view.s; } } }
    if(doc.view && mode==='pages'){ const v=viewWorld(); const vis=pagesSorted().some(p=>!(p.x>v[2]||p.y>v[3]||p.x+p.w<v[0]||p.y+p.h<v[1])); if(!vis){ const ps=pagesSorted(); let best=ps[0]; const cy=(v[1]+v[3])/2; for(const p of ps) if(Math.abs(p.y+p.h/2-cy)<Math.abs(best.y+best.h/2-cy)) best=p; goPage(best); } }
    invalidate(); if(mode==='pages' && pagesSorted().length>1) pageChip.style.display='block'; } };
}

