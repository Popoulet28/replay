/* ================= Cours : dossiers, canvas infini, PDF ================= */
const NB = { db:null, nodes:new Map(), ready:false, loading:null, urls:new Map(), editor:null };
function nbOpen(){
  if(NB.db) return Promise.resolve(NB.db);
  return new Promise((res,rej)=>{ const r=indexedDB.open('replay-notes',1);
    r.onupgradeneeded=()=>{ const d=r.result; d.createObjectStore('nodes',{keyPath:'id'}); d.createObjectStore('docs'); d.createObjectStore('blobs'); };
    r.onsuccess=()=>{ NB.db=r.result; res(NB.db); }; r.onerror=()=>rej(r.error); });
}
function nbTx(store, mode, fn){
  return nbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(store,mode); const rq=fn(tx.objectStore(store)); let out;
    if(rq) rq.onsuccess=()=>{ out=rq.result; };
    tx.oncomplete=()=>res(out); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); }));
}
const nbGet=(s,k)=>nbTx(s,'readonly',st=>st.get(k));
const nbPut=(s,v,k)=>nbTx(s,'readwrite',st=>k===undefined?st.put(v):st.put(v,k));
const nbDel=(s,k)=>nbTx(s,'readwrite',st=>st.delete(k));
const nbAll=s=>nbTx(s,'readonly',st=>st.getAll());
function nbInit(){
  if(NB.ready) return Promise.resolve();
  if(!NB.loading) NB.loading=nbAll('nodes').then(list=>{ list.forEach(n=>NB.nodes.set(n.id,n)); }).catch(e=>console.warn('notes',e)).then(()=>{ NB.ready=true; });
  return NB.loading;
}
async function nbBlobURL(key){
  if(!key) return null; if(NB.urls.has(key)) return NB.urls.get(key);
  const b=await nbGet('blobs',key); if(!b) return null;
  const u=URL.createObjectURL(b); NB.urls.set(key,u); return u;
}
function nbForget(key){ const u=NB.urls.get(key); if(u){ URL.revokeObjectURL(u); NB.urls.delete(key); } }
const nbIsRoot=p=>typeof p==='string' && p.startsWith('c:');
function nbCourseOf(n){ let x=n, guard=0; while(x && !nbIsRoot(x.parent) && guard++<50) x=NB.nodes.get(x.parent); return x && nbIsRoot(x.parent) ? x.parent.slice(2) : null; }
function nbChildren(parent){
  return [...NB.nodes.values()].filter(n=>n.parent===parent)
    .sort((a,b)=> (a.type===b.type?0:(a.type==='folder'?-1:1)) || (b.updated||0)-(a.updated||0));
}
function nbDescendantIds(id){ const out=[]; const walk=p=>{ for(const c of nbChildren(p)){ out.push(c.id); if(c.type==='folder') walk(c.id); } }; walk(id); return out; }
async function nbSaveNode(n){ n.updated=Date.now(); NB.nodes.set(n.id,n); await nbPut('nodes',n); }
async function nbCreate(type, parent, name){
  const n={id:(type==='folder'?'f':'n')+uid().slice(1), type, parent, name, created:today(), createdAt:Date.now(), updated:Date.now(), stamps:[]};
  await nbSaveNode(n); return n;
}
async function nbDeleteNode(id){
  const n=NB.nodes.get(id); if(!n) return;
  for(const c of nbChildren(id)) await nbDeleteNode(c.id);
  if(n.type==='note'){
    const d=await nbGet('docs',id);
    if(d) for(const it of (d.items||[])) if(it.blob){ await nbDel('blobs',it.blob); nbForget(it.blob); }
    if(n.thumb){ await nbDel('blobs',n.thumb); nbForget(n.thumb); }
    await nbDel('docs',id);
  }
  NB.nodes.delete(id); await nbDel('nodes',id);
}
function nbNoteCount(course){ let n=0; for(const x of NB.nodes.values()) if(x.type==='note' && nbCourseOf(x)===course) n++; return n; }
function nbStampsOf(course, type){
  const out=[];
  for(const n of NB.nodes.values()) if(n.type==='note' && nbCourseOf(n)===course)
    for(const s of (n.stamps||[])) if(s.t===type) out.push({node:n, s});
  return out.sort((a,b)=>(b.node.updated||0)-(a.node.updated||0));
}

/* ---- images ---- */
function loadImgEl(key){
  return new Promise(res=>{ nbBlobURL(key).then(u=>{ if(!u) return res(null); const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=u; }); });
}
async function putBlob(blob, prefix){ const key=(prefix||'b:')+uid(); await nbPut('blobs',blob,key); return key; }

/* ---- PDF (pdf.js bundled in lib/, loaded as blob modules so the MIME type never matters) ---- */
let PDFJS=null;
async function loadPdfJs(){
  if(PDFJS) return PDFJS;
  const src=await (await fetch('lib/pdf.min.mjs')).text();
  const mod=await import(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  const wsrc=await (await fetch('lib/pdf.worker.min.mjs')).text();
  mod.GlobalWorkerOptions.workerPort=new Worker(URL.createObjectURL(new Blob([wsrc],{type:'text/javascript'})),{type:'module'});
  PDFJS=mod; return mod;
}
async function pdfPages(file, onProgress){
  const pdfjs=await loadPdfJs();
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const out=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i); const v1=page.getViewport({scale:1});
    const vp=page.getViewport({scale:Math.min(3, 1700/v1.width)});
    const c=document.createElement('canvas'); c.width=Math.round(vp.width); c.height=Math.round(vp.height);
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
    await page.render({canvasContext:x, viewport:vp}).promise;
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.88));
    out.push({blob, w:c.width, h:c.height}); page.cleanup(); onProgress&&onProgress(i,pdf.numPages);
  }
  return out;
}
function progressBox(text){
  const label=el('div',{class:'res-big',text}); const bar=ruler(0);
  const close=modal(el('div',{}, label, el('div',{style:{marginTop:'12px'}},bar)));
  return {set:(t,f)=>{ label.textContent=t; bar.querySelector('i').style.width=Math.round(f*100)+'%'; }, close};
}
/* place pages under the existing content of a doc */
async function addPdfToDoc(doc, file){
  const pb=progressBox('Lecture du PDF…');
  try{
    const pages=await pdfPages(file,(i,n)=>pb.set('Import : page '+i+' sur '+n, i/n));
    let y=contentBox(doc.strokes||[], doc.items||[]); y = y ? y.y+y.h+80 : 0;
    doc.items=doc.items||[];
    for(const pg of pages){ const key=await putBlob(pg.blob); const w=1000, h=Math.round(1000*pg.h/pg.w); doc.items.push({id:uid(),kind:'img',pdf:true,blob:key,x:0,y,w,h}); y+=h+40; }
    pb.close(); return pages.length;
  }catch(e){ pb.close(); console.warn(e); toast('Impossible de lire ce PDF.','err'); return 0; }
}

/* ---- geometry + offscreen rendering ---- */
const strokeCache=new WeakMap();
function sInfo(st){
  let c=strokeCache.get(st); if(c) return c;
  const a=st.pts, p=new Path2D(); let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<a.length;i+=3){ const x=a[i], y=a[i+1]; if(i===0) p.moveTo(x,y); else p.lineTo(x,y); if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  if(a.length===3) p.lineTo(a[0]+0.01,a[1]);
  const m=st.w; c={p, b:[x0-m,y0-m,x1+m,y1+m]}; strokeCache.set(st,c); return c;
}
function contentBox(strokes, items){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const s of strokes){ const b=sInfo(s).b; x0=Math.min(x0,b[0]); y0=Math.min(y0,b[1]); x1=Math.max(x1,b[2]); y1=Math.max(y1,b[3]); }
  for(const it of items){ const w=it.kind==='img'?it.w:30, h=it.kind==='img'?it.h:30; x0=Math.min(x0,it.x); y0=Math.min(y0,it.y); x1=Math.max(x1,it.x+w); y1=Math.max(y1,it.y+h); }
  return isFinite(x0) ? {x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)} : null;
}
function paintStrokes(ctx, strokes, b){
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(const pass of ['hl','pen']){
    ctx.globalAlpha = pass==='hl'?0.4:1; ctx.globalCompositeOperation = pass==='hl'?'multiply':'source-over';
    for(const st of strokes){ if(st.tool!==pass) continue; const c=sInfo(st);
      if(b && (c.b[0]>b[2]||c.b[2]<b[0]||c.b[1]>b[3]||c.b[3]<b[1])) continue;
      ctx.strokeStyle=st.color; ctx.lineWidth=st.w; ctx.stroke(c.p); }
  }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}
async function renderRegion(strokes, items, rect, outW){
  const sc=outW/rect.w, outH=Math.max(1,Math.min(2400,Math.round(rect.h*sc)));
  const c=document.createElement('canvas'); c.width=Math.round(outW); c.height=outH;
  const x=c.getContext('2d'); x.fillStyle='#fffefa'; x.fillRect(0,0,c.width,c.height);
  x.setTransform(sc,0,0,sc,-rect.x*sc,-rect.y*sc);
  for(const it of items) if(it.kind==='img'){
    if(it.x>rect.x+rect.w||it.y>rect.y+rect.h||it.x+it.w<rect.x||it.y+it.h<rect.y) continue;
    const im=await loadImgEl(it.blob); if(im) x.drawImage(im,it.x,it.y,it.w,it.h);
  }
  paintStrokes(x, strokes, [rect.x,rect.y,rect.x+rect.w,rect.y+rect.h]);
  return await new Promise(r=>c.toBlob(r,'image/jpeg',0.86));
}
async function sendRegionToReplay(node, strokes, items, rect){
  const blob=await renderRegion(strokes, items, rect, 1400);
  const ref=await storeImage(blob);
  const course=nbCourseOf(node)||courses()[0];
  const p={ id:uid(), created:today(), createdAt:Date.now(), course, topics:[], reasons:[], source:node.name,
    problemImg:ref, problemText:null, solutionImg:null, solutionText:null, noteImg:null, noteText:null, srs:newSrs(), history:[], archived:false };
  await saveProblem(p);
  toast('Ajouté à ton carnet · +10 XP. Pense à indiquer pourquoi dans le Carnet.');
}
const STAMP={q:{label:'?',color:'#d3302f',name:'Pas compris'}, star:{label:'★',color:'#c98a00',name:'Important'}, f:{label:'ƒ',color:'#1d2fa0',name:'Formule'}};
function stampRect(s){ return s.t==='f' ? {x:s.x-40,y:s.y-130,w:900,h:300} : {x:s.x-60,y:s.y-170,w:1000,h:380}; }

/* ================= editor ================= */
async function openNote(id, focus){
  const node=NB.nodes.get(id); if(!node) return;
  const doc=(await nbGet('docs',id)) || {strokes:[],items:[],view:null};
  const ed=makeEditor(node, doc, focus);
  document.getElementById('layer').append(ed.root); NB.editor=ed; ed.start();
}
function makeEditor(node, doc, focus){
  const root=el('div',{class:'editor'});
  const cv=el('canvas',{class:'ed-canvas'}); const ctx=cv.getContext('2d');
  const wrap=el('div',{class:'ed-wrap'}, cv);
  let W=0,H=0,dpr=1, view=doc.view?Object.assign({},doc.view):{s:1,tx:60,ty:60};
  let strokes=(doc.strokes||[]).slice(), items=(doc.items||[]).slice();
  let tool='pen', color='#1d2fa0', stampType='q', prevTool='pen';
  const hist=[], redo=[], imgs=new Map();
  let penSeen=false, dirty=false, viewDirty=false, saveT=null, raf=0, closed=false;
  let selection=null, selRect=null, moveOff=null, cur=null;

  const toS=(x,y)=>[x*view.s+view.tx, y*view.s+view.ty];
  const toW=(x,y)=>[(x-view.tx)/view.s, (y-view.ty)/view.s];
  function img(key){ let im=imgs.get(key); if(!im){ im=new Image(); imgs.set(key,im); im.onload=req; nbBlobURL(key).then(u=>{ if(u) im.src=u; }); } return im; }
  function req(){ if(!raf) raf=requestAnimationFrame(()=>{ raf=0; draw(); }); }
  function size(){ const r=wrap.getBoundingClientRect(); W=Math.max(1,r.width); H=Math.max(1,r.height); dpr=window.devicePixelRatio||1; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+'px'; cv.style.height=H+'px'; draw(); }
  function grid(){
    let step=30*view.s; while(step<16) step*=5; while(step>160) step/=5;
    const ox=((view.tx%step)+step)%step, oy=((view.ty%step)+step)%step;
    ctx.strokeStyle='rgba(226,122,62,.17)'; ctx.lineWidth=1; ctx.beginPath();
    for(let x=ox;x<W;x+=step){ ctx.moveTo(Math.round(x)+.5,0); ctx.lineTo(Math.round(x)+.5,H); }
    for(let y=oy;y<H;y+=step){ ctx.moveTo(0,Math.round(y)+.5); ctx.lineTo(W,Math.round(y)+.5); }
    ctx.stroke();
  }
  function selBox(){
    if(!selection) return null;
    const ss=strokes.filter(s=>selection.has(s)), ii=items.filter(i=>selection.has(i));
    return contentBox(ss, ii);
  }
  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle='#fffefa'; ctx.fillRect(0,0,W,H); grid();
    ctx.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*view.tx,dpr*view.ty);
    const [x0,y0]=toW(0,0), [x1,y1]=toW(W,H), b=[x0,y0,x1,y1];
    const off=(o)=> selection&&moveOff&&selection.has(o) ? moveOff : null;
    for(const it of items) if(it.kind==='img'){
      const m=off(it), ix=it.x+(m?m[0]:0), iy=it.y+(m?m[1]:0);
      if(ix>x1||iy>y1||ix+it.w<x0||iy+it.h<y0) continue;
      const im=img(it.blob);
      if(im.complete && im.naturalWidth) ctx.drawImage(im,ix,iy,it.w,it.h); else { ctx.fillStyle='#f0efe8'; ctx.fillRect(ix,iy,it.w,it.h); }
      if(it.pdf){ ctx.strokeStyle='#d6d3c7'; ctx.lineWidth=1.2/view.s; ctx.strokeRect(ix,iy,it.w,it.h); }
    }
    if(moveOff && selection){
      const still=strokes.filter(s=>!selection.has(s)); paintStrokes(ctx, still, b);
      ctx.save(); ctx.translate(moveOff[0],moveOff[1]); paintStrokes(ctx, strokes.filter(s=>selection.has(s)), null); ctx.restore();
    } else paintStrokes(ctx, strokes, b);
    if(cur && cur.tool==='hl') paintLive(cur);
    const sb=selBox();
    if(sb){ ctx.setLineDash([6/view.s,5/view.s]); ctx.strokeStyle='#1d2fa0'; ctx.lineWidth=1.6/view.s; const m=moveOff||[0,0]; ctx.strokeRect(sb.x-8/view.s+m[0], sb.y-8/view.s+m[1], sb.w+16/view.s, sb.h+16/view.s); ctx.setLineDash([]); }
    if(selRect){ ctx.setLineDash([6/view.s,5/view.s]); ctx.strokeStyle='#1d2fa0'; ctx.lineWidth=1.4/view.s; ctx.fillStyle='rgba(29,47,160,.06)'; const r=normRect(selRect); ctx.fillRect(r.x,r.y,r.w,r.h); ctx.strokeRect(r.x,r.y,r.w,r.h); ctx.setLineDash([]); }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    for(const it of items) if(it.kind==='stamp'){
      const m=off(it); const [sx,sy]=toS(it.x+(m?m[0]:0), it.y+(m?m[1]:0)); if(sx<-30||sy<-30||sx>W+30||sy>H+30) continue;
      const st=STAMP[it.stamp]||STAMP.q; const done=it.stamp==='q'&&it.done;
      ctx.beginPath(); ctx.arc(sx,sy,17,0,Math.PI*2); ctx.fillStyle=done?'#1d8a4e':st.color; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='#fffefa'; ctx.stroke(); ctx.lineWidth=1.5; ctx.strokeStyle=done?'#1d8a4e':st.color; ctx.beginPath(); ctx.arc(sx,sy,21,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='700 19px Kalam, "Bricolage Grotesque", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(done?'✓':st.label, sx, sy+1);
    }
    if(cur && cur.tool==='pen'){ ctx.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*view.tx,dpr*view.ty); paintLive(cur); }
    placeSelBar();
  }
  function paintLive(st){
    const a=st.pts; ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=st.color; ctx.lineWidth=st.w;
    if(st.tool==='hl'){ ctx.globalAlpha=0.4; ctx.globalCompositeOperation='multiply'; }
    ctx.beginPath(); ctx.moveTo(a[0],a[1]); for(let i=3;i<a.length;i+=3) ctx.lineTo(a[i],a[i+1]); if(a.length===3) ctx.lineTo(a[0]+0.01,a[1]); ctx.stroke(); ctx.restore();
  }
  const normRect=r=>({x:Math.min(r.x0,r.x1), y:Math.min(r.y0,r.y1), w:Math.abs(r.x1-r.x0), h:Math.abs(r.y1-r.y0)});

  /* ---- history & saving ---- */
  function snap(){ hist.push({strokes:strokes.slice(), items:items.slice()}); if(hist.length>80) hist.shift(); redo.length=0; }
  function changed(){ dirty=true; clearTimeout(saveT); saveT=setTimeout(save,800); req(); updateCounts(); }
  function undo(){ if(!hist.length) return; redo.push({strokes,items}); const h=hist.pop(); strokes=h.strokes; items=h.items; selection=null; changed(); }
  function redoFn(){ if(!redo.length) return; hist.push({strokes,items}); const h=redo.pop(); strokes=h.strokes; items=h.items; selection=null; changed(); }
  async function save(){
    clearTimeout(saveT);
    if(!dirty && !viewDirty) return;
    const wasDirty=dirty; dirty=false; viewDirty=false;
    await nbPut('docs',{strokes, items, view}, node.id);
    if(wasDirty){ node.stamps=items.filter(i=>i.kind==='stamp').map(i=>({id:i.id,t:i.stamp,done:!!i.done,x:i.x,y:i.y})); node.thumbStale=true; await nbSaveNode(node); }
  }
  async function makeThumb(){
    const box=contentBox(strokes, items);
    if(node.thumb){ await nbDel('blobs',node.thumb); nbForget(node.thumb); node.thumb=null; }
    if(box){ const pad=40; const r={x:box.x-pad,y:box.y-pad,w:box.w+2*pad,h:Math.min(box.h+2*pad,(box.w+2*pad)*0.75)};
      const blob=await renderRegion(strokes, items, r, 420); node.thumb=await putBlob(blob,'th:'); }
    node.thumbStale=false; await nbSaveNode(node);
  }
  async function close(){
    if(closed) return; closed=true;
    await save(); if(node.thumbStale || (!node.thumb && (strokes.length||items.length))) await makeThumb().catch(()=>{});
    window.removeEventListener('resize',size); root.remove(); NB.editor=null; render();
  }

  /* ---- erasing, selecting ---- */
  function segDist2(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay; const l=dx*dx+dy*dy; let t=l?((px-ax)*dx+(py-ay)*dy)/l:0; t=Math.max(0,Math.min(1,t)); const x=ax+t*dx-px, y=ay+t*dy-py; return x*x+y*y; }
  function hitStroke(st,wx,wy,r){
    const b=sInfo(st).b; if(wx<b[0]-r||wx>b[2]+r||wy<b[1]-r||wy>b[3]+r) return false;
    const a=st.pts, R=(r+st.w/2)*(r+st.w/2);
    if(a.length===3) return (a[0]-wx)**2+(a[1]-wy)**2<=R;
    for(let i=3;i<a.length;i+=3) if(segDist2(wx,wy,a[i-3],a[i-2],a[i],a[i+1])<=R) return true;
    return false;
  }
  let erasedAny=false;
  function eraseAt(sx,sy){
    const [wx,wy]=toW(sx,sy), r=12/view.s;
    const keep=strokes.filter(st=>!hitStroke(st,wx,wy,r));
    if(keep.length!==strokes.length){ if(!erasedAny){ snap(); erasedAny=true; } strokes=keep; changed(); }
  }
  function finishSelect(){
    const r=normRect(selRect); selRect=null;
    const inR=(x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
    const set=new Set();
    for(const st of strokes){ const b=sInfo(st).b; if(b[2]<r.x||b[0]>r.x+r.w||b[3]<r.y||b[1]>r.y+r.h) continue; const a=st.pts; for(let i=0;i<a.length;i+=3) if(inR(a[i],a[i+1])){ set.add(st); break; } }
    for(const it of items){ const cx=it.x+(it.kind==='img'?it.w/2:0), cy=it.y+(it.kind==='img'?it.h/2:0); if(inR(cx,cy)) set.add(it); }
    selection=set.size?set:null; req();
  }
  function commitMove(){
    const [dx,dy]=moveOff; moveOff=null; if(Math.abs(dx)+Math.abs(dy)<0.5){ req(); return; }
    snap(); const ns=new Set();
    strokes=strokes.map(st=>{ if(!selection.has(st)) return st; const a=st.pts.slice(); for(let i=0;i<a.length;i+=3){ a[i]=Math.round((a[i]+dx)*10)/10; a[i+1]=Math.round((a[i+1]+dy)*10)/10; } const n=Object.assign({},st,{pts:a}); ns.add(n); return n; });
    items=items.map(it=>{ if(!selection.has(it)) return it; const n=Object.assign({},it,{x:it.x+dx,y:it.y+dy}); ns.add(n); return n; });
    selection=ns; changed();
  }
  function deleteSelection(){ if(!selection) return; snap(); strokes=strokes.filter(s=>!selection.has(s)); items=items.filter(i=>!selection.has(i)); selection=null; changed(); }
  const selBar=el('div',{class:'sel-bar',style:{display:'none'}},
    el('button',{class:'btn small',type:'button',text:'→ Carnet Replay',onclick:async()=>{ const b=selBox(); if(!b) return; const pad=30; await sendRegionToReplay(node, strokes, items, {x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:b.h+2*pad}); }}),
    el('button',{class:'btn small danger',type:'button',text:'Supprimer',onclick:deleteSelection}),
    el('button',{class:'btn small ghost',type:'button',text:'✕',title:'Désélectionner',onclick:()=>{ selection=null; req(); }}));
  function placeSelBar(){
    const b=selBox(); if(!b||moveOff){ selBar.style.display='none'; return; }
    const [sx,sy]=toS(b.x,b.y); selBar.style.display='flex';
    selBar.style.left=Math.max(8,Math.min(W-330,sx))+'px'; selBar.style.top=Math.max(8,sy-58)+'px';
  }

  /* ---- stamps ---- */
  function stampAt(sx,sy){ for(let i=items.length-1;i>=0;i--){ const it=items[i]; if(it.kind!=='stamp') continue; const [x,y]=toS(it.x,it.y); if((x-sx)**2+(y-sy)**2<=24*24) return it; } return null; }
  function addStamp(sx,sy){ const [wx,wy]=toW(sx,sy); snap(); items=items.concat([{id:uid(),kind:'stamp',stamp:stampType,x:wx,y:wy,done:false}]); setTool(prevTool); changed(); }
  function replaceItem(it, patch){ snap(); const n=Object.assign({},it,patch); items=items.map(x=>x===it?n:x); changed(); return n; }
  let pop=null;
  function stampMenu(it, sx, sy){
    closePop();
    const st=STAMP[it.stamp]||STAMP.q;
    pop=el('div',{class:'stamp-pop',style:{left:Math.min(W-240,sx+18)+'px',top:Math.min(H-170,sy+10)+'px'}},
      el('div',{class:'small',style:{fontWeight:700,marginBottom:'6px'},text:st.name}),
      it.stamp==='q'? el('button',{class:'btn small',type:'button',text:it.done?'Marquer « pas résolu »':'Résolu ✓',onclick:()=>{ replaceItem(it,{done:!it.done}); closePop(); if(!it.done) xpToast(10, nbCourseOf(node)||'Cours'); }}):null,
      el('button',{class:'btn small',type:'button',text:'→ Carnet Replay',onclick:async()=>{ closePop(); await sendRegionToReplay(node, strokes, items, stampRect(it)); }}),
      el('button',{class:'btn small danger',type:'button',text:'Supprimer',onclick:()=>{ snap(); items=items.filter(x=>x!==it); changed(); closePop(); }}));
    wrap.append(pop);
  }
  function closePop(){ if(pop){ pop.remove(); pop=null; } }

  /* ---- pointer input ---- */
  const ptrs=new Map(); let mode=null, drawId=null, drawType=null, last=null, pinch0=null, selStartW=null, downAt=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
  function startPinch(){
    const [a,b]=[...ptrs.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1])||1; const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    pinch0={d, m, v:Object.assign({},view)}; mode='pinch'; selRect=null; moveOff=null;
  }
  cv.addEventListener('pointerdown', e=>{
    closePop();
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    if(e.pointerType==='pen') penSeen=true;
    const p=pos(e); ptrs.set(e.pointerId,p);
    const touchNav = e.pointerType==='touch' && penSeen && S.settings.penOnly!==false;
    if(e.pointerType==='touch' && [...ptrs.keys()].length>=2){
      if(mode==='draw' && drawType==='touch'){ cur=null; }
      if(mode==='draw' && drawType==='pen'){ ptrs.delete(e.pointerId); return; }
      startPinch(); e.preventDefault(); return;
    }
    if(mode && mode!=='pan') return;
    if(tool==='hand' || touchNav || e.button===1){ mode='pan'; last=p; return; }
    const hit=stampAt(p[0],p[1]); if(hit){ mode='stamp-tap'; downAt={p,hit}; return; }
    if(tool==='stamp'){ addStamp(p[0],p[1]); mode=null; return; }
    if(tool==='pen'||tool==='hl'){
      const [wx,wy]=toW(p[0],p[1]); mode='draw'; drawId=e.pointerId; drawType=e.pointerType;
      cur={id:uid(), tool, color: tool==='hl'?'#f2e600':color, w: tool==='hl'?16:2.3, pts:[Math.round(wx*10)/10,Math.round(wy*10)/10,e.pressure||0.5]};
      req();
    } else if(tool==='eraser'){ mode='erase'; erasedAny=false; eraseAt(p[0],p[1]); }
    else if(tool==='select'){
      const [wx,wy]=toW(p[0],p[1]); const b=selBox();
      if(b && wx>=b.x-12/view.s && wx<=b.x+b.w+12/view.s && wy>=b.y-12/view.s && wy<=b.y+b.h+12/view.s){ mode='movesel'; selStartW=[wx,wy]; moveOff=[0,0]; }
      else { selection=null; mode='select'; selRect={x0:wx,y0:wy,x1:wx,y1:wy}; }
      req();
    }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e=>{
    if(!ptrs.has(e.pointerId)) return;
    const p=pos(e); const prev=ptrs.get(e.pointerId); ptrs.set(e.pointerId,p);
    if(mode==='pinch' && ptrs.size>=2){
      const [a,b]=[...ptrs.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1])||1; const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const v0=pinch0.v; const s=Math.max(0.08,Math.min(8,v0.s*d/pinch0.d));
      const wx=(pinch0.m[0]-v0.tx)/v0.s, wy=(pinch0.m[1]-v0.ty)/v0.s;
      view.s=s; view.tx=m[0]-wx*s; view.ty=m[1]-wy*s; viewDirty=true; req(); return;
    }
    if(mode==='pan'){ view.tx+=p[0]-last[0]; view.ty+=p[1]-last[1]; last=p; viewDirty=true; req(); return; }
    if(mode==='draw' && e.pointerId===drawId && cur){
      const evs=(e.getCoalescedEvents && e.getCoalescedEvents().length)?e.getCoalescedEvents():[e];
      const r=cv.getBoundingClientRect();
      for(const ev of evs){ const [wx,wy]=toW(ev.clientX-r.left, ev.clientY-r.top); const a=cur.pts; const lx=a[a.length-3], ly=a[a.length-2];
        if(Math.abs(wx-lx)+Math.abs(wy-ly) < 0.7/view.s) continue;
        a.push(Math.round(wx*10)/10, Math.round(wy*10)/10, ev.pressure||0.5);
        if(cur.tool==='pen'){ ctx.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*view.tx,dpr*view.ty); ctx.lineCap='round'; ctx.strokeStyle=cur.color; ctx.lineWidth=cur.w; ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(wx,wy); ctx.stroke(); }
      }
      if(cur.tool==='hl') req();
      return;
    }
    if(mode==='erase'){ eraseAt(p[0],p[1]); return; }
    if(mode==='select'){ const [wx,wy]=toW(p[0],p[1]); selRect.x1=wx; selRect.y1=wy; req(); return; }
    if(mode==='movesel'){ const [wx,wy]=toW(p[0],p[1]); moveOff=[wx-selStartW[0], wy-selStartW[1]]; req(); return; }
  });
  function endPtr(e){
    if(!ptrs.has(e.pointerId)) return;
    const p=ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
    if(mode==='pinch'){ if(ptrs.size===1){ mode='pan'; last=[...ptrs.values()][0]; } else if(ptrs.size===0) mode=null; return; }
    if(mode==='draw' && e.pointerId===drawId){
      if(cur){ const a=cur.pts; let ps=0, n=0; for(let i=2;i<a.length;i+=3){ ps+=a[i]; n++; }
        if(cur.tool==='pen') cur.w=Math.round(2.3*(0.65+(ps/n)*0.7)*100)/100;
        const done=Object.assign({},cur,{pts:cur.pts.slice()}); cur=null; snap(); strokes=strokes.concat([done]); changed(); }
      mode=null; return;
    }
    if(mode==='stamp-tap'){ const d=Math.hypot(p[0]-downAt.p[0],p[1]-downAt.p[1]); if(d<10) stampMenu(downAt.hit,p[0],p[1]); mode=null; return; }
    if(mode==='select'){ finishSelect(); mode=null; return; }
    if(mode==='movesel'){ commitMove(); mode=null; return; }
    if(ptrs.size===0) mode=null;
  }
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', e=>{ if(mode==='draw') cur=null; endPtr(e); req(); });
  cv.addEventListener('wheel', e=>{
    e.preventDefault(); const [px,py]=pos(e);
    if(e.ctrlKey||e.metaKey){ const k=Math.exp(-e.deltaY*0.0025); const s=Math.max(0.08,Math.min(8,view.s*k)); const wx=(px-view.tx)/view.s, wy=(py-view.ty)/view.s; view.s=s; view.tx=px-wx*s; view.ty=py-wy*s; }
    else { view.tx-=e.deltaX; view.ty-=e.deltaY; }
    viewDirty=true; req();
  }, {passive:false});

  /* ---- toolbar ---- */
  const tb={};
  function setTool(t){ if(t!=='stamp') prevTool=t; tool=t; for(const k in tb) tb[k].classList.toggle('on',k===t||(t==='stamp'&&k==='stamp-'+stampType)); colorRow.style.display=(t==='pen')?'flex':'none'; if(t!=='select'){ selection=null; req(); } }
  const tbtn=(id,label,title)=>{ const b=el('button',{type:'button',class:'tb',title,'aria-label':title,onclick:()=>setTool(id)}, label); tb[id]=b; return b; };
  const sbtn=(type)=>{ const b=el('button',{type:'button',class:'tb stamp-btn',title:'Tampon '+STAMP[type].name,'aria-label':'Tampon '+STAMP[type].name,onclick:()=>{ stampType=type; setTool('stamp'); }}, el('span',{class:'stamp-ic',style:{background:STAMP[type].color},text:STAMP[type].label})); tb['stamp-'+type]=b; return b; };
  const sw=[];
  const colorRow=el('div',{class:'ed-colors'}, ...[['#1d2fa0','Bleu'],['#16182a','Noir'],['#d3302f','Rouge'],['#1d8a4e','Vert']].map(([c,n])=>{ const b=el('button',{type:'button',class:'swatch'+(c===color?' on':''),title:n,'aria-label':n,style:{background:c},onclick:()=>{ color=c; sw.forEach(x=>x.classList.toggle('on',x===b)); }}); sw.push(b); return b; }));
  const fileImg=el('input',{type:'file',accept:'image/*',style:{display:'none'}});
  const fileCam=el('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'}});
  const filePdf=el('input',{type:'file',accept:'application/pdf,.pdf',style:{display:'none'}});
  async function insertImage(f){
    if(!f) return; let blob; try{ blob=await recompress(f,2000,0.86,'image/jpeg'); }catch(e){ blob=f; }
    const im=await loadImage(blob).catch(()=>null); const ar=im?im.naturalHeight/im.naturalWidth:0.75;
    const key=await putBlob(blob); const w=Math.min(W*0.6,700)/view.s; const [cx,cy]=toW(W/2,H/2);
    snap(); items=items.concat([{id:uid(),kind:'img',blob:key,x:cx-w/2,y:cy-w*ar/2,w,h:w*ar}]); changed();
  }
  fileImg.addEventListener('change',()=>{ insertImage(fileImg.files[0]); fileImg.value=''; });
  fileCam.addEventListener('change',()=>{ insertImage(fileCam.files[0]); fileCam.value=''; });
  filePdf.addEventListener('change',async()=>{ const f=filePdf.files[0]; filePdf.value=''; if(!f) return;
    const prev=contentBox(strokes,items); const startY=prev?prev.y+prev.h+80:0;
    const d={strokes, items:items.slice()}; const n=await addPdfToDoc(d,f);
    if(n){ snap(); items=d.items; view.s=Math.min(1.2,(W-60)/1000); view.tx=30; view.ty=30-startY*view.s; viewDirty=true; changed(); toast(n+' page'+(n>1?'s':'')+' importée'+(n>1?'s':'')); } });
  const title=el('button',{type:'button',class:'ed-title',text:node.name,title:'Renommer',onclick:async()=>{ const v=await promptBox('Nom de la note',node.name); if(v){ node.name=v; title.textContent=v; await nbSaveNode(node); } }});
  const countBtn=el('button',{type:'button',class:'btn small ghost',onclick:()=>togglePanel()});
  const panel=el('div',{class:'ed-panel',style:{display:'none'}});
  function updateCounts(){ const q=items.filter(i=>i.kind==='stamp'&&i.stamp==='q'&&!i.done).length, all=items.filter(i=>i.kind==='stamp').length; countBtn.textContent='Repères '+all+(q?' · '+q+' ?':''); if(panel.style.display!=='none') fillPanel(); }
  function focusOn(x,y,s){ view.s=s||Math.max(view.s,1); view.tx=W/2-x*view.s; view.ty=H/2-y*view.s; viewDirty=true; req(); }
  function fillPanel(){
    const st=items.filter(i=>i.kind==='stamp');
    panel.replaceChildren(el('div',{class:'row'}, el('b',{text:'Repères'}), el('span',{class:'spacer'}), el('button',{class:'btn small ghost',type:'button',text:'✕',onclick:()=>togglePanel(false)})),
      st.length? el('div',{class:'ed-list'}, st.map(it=>{ const S2=STAMP[it.stamp]||STAMP.q; return el('button',{type:'button',class:'ed-li',onclick:()=>focusOn(it.x+300,it.y)}, el('span',{class:'stamp-ic',style:{background:(it.stamp==='q'&&it.done)?'#1d8a4e':S2.color},text:(it.stamp==='q'&&it.done)?'✓':S2.label}), el('span',{text:S2.name+((it.stamp==='q'&&it.done)?' (résolu)':'')})); }))
      : el('p',{class:'muted small',text:'Pose des tampons ?, ★ ou ƒ dans la marge pour retrouver les passages importants.'}));
  }
  function togglePanel(force){ const show=force!==undefined?force:panel.style.display==='none'; panel.style.display=show?'block':'none'; if(show) fillPanel(); }
  const top=el('div',{class:'ed-top'},
    el('button',{type:'button',class:'tb',title:'Fermer','aria-label':'Fermer',onclick:()=>close()},'←'),
    title, el('span',{class:'spacer'}),
    tbtn('pen','✎','Stylo'), tbtn('hl','▬','Surligneur'), tbtn('eraser','⌫','Gomme'), tbtn('select','⬚','Sélection'), tbtn('hand','✋','Déplacer la page'),
    el('span',{class:'tb-sep'}), sbtn('q'), sbtn('star'), sbtn('f'),
    el('span',{class:'tb-sep'}),
    el('button',{type:'button',class:'tb',title:'Insérer une image','aria-label':'Insérer une image',onclick:()=>fileImg.click()},'🖼'),
    el('button',{type:'button',class:'tb',title:'Prendre une photo','aria-label':'Prendre une photo',onclick:()=>fileCam.click()},'📷'),
    el('button',{type:'button',class:'tb tb-text',title:'Importer un PDF',onclick:()=>filePdf.click()},'PDF'),
    el('span',{class:'tb-sep'}),
    el('button',{type:'button',class:'tb',title:'Annuler','aria-label':'Annuler',onclick:undo},'↶'),
    el('button',{type:'button',class:'tb',title:'Rétablir','aria-label':'Rétablir',onclick:redoFn},'↷'),
    fileImg, fileCam, filePdf);
  const sub=el('div',{class:'ed-sub'}, colorRow, el('span',{class:'spacer'}), countBtn);
  wrap.append(selBar, panel);
  root.append(top, sub, wrap);
  setTool('pen'); updateCounts();
  return { root, close, start:()=>{
    window.addEventListener('resize',size); size();
    if(focus){ focusOn(focus.x+300, focus.y, 1.1); }
    else if(!doc.view){ const b=contentBox(strokes,items); if(b){ view.s=Math.min(1.1,(W-60)/Math.max(400,b.w)); view.tx=30-b.x*view.s; view.ty=30-b.y*view.s; } }
    req(); } };
}

/* ================= views ================= */
function promptBox(label, value){
  return new Promise(res=>{ let close; const inp=el('input',{type:'text',value:value||''});
    const done=v=>{ close(); res(v); };
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') done(inp.value.trim()||null); });
    close=modal(el('div',{}, el('h3',{text:label}), inp, el('div',{class:'row',style:{marginTop:'14px'}}, el('span',{class:'spacer'}),
      el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>done(null)}),
      el('button',{class:'btn primary',type:'button',text:'OK',onclick:()=>done(inp.value.trim()||null)}))));
    setTimeout(()=>{ inp.focus(); inp.select(); },60); });
}
function dateName(){ return 'Cours du '+parseYmd(today()).toLocaleDateString('fr-CH',{day:'numeric',month:'long'}); }
S.coursPath=null; S.coursTab='files'; S.coursSearch='';
function viewCours(){
  const root=el('div');
  if(!NB.ready){ root.append(el('div',{class:'card empty muted',text:'Ouverture de tes cours…'})); nbInit().then(()=>{ if(S.view==='cours') render(); }); return root; }
  if(S.coursPath && !nbIsRoot(S.coursPath) && !NB.nodes.has(S.coursPath)) S.coursPath=null;
  return S.coursPath ? coursFolder(root) : coursHome(root);
}
function coursHome(root){
  root.append(el('h2',{text:'Cours'}));
  const search=el('input',{type:'text',placeholder:'Chercher une note ou un dossier…',value:S.coursSearch});
  const results=el('div');
  const drawResults=()=>{ S.coursSearch=search.value; results.replaceChildren(); const q=search.value.trim().toLowerCase(); if(!q){ results.append(courseGrid()); return; }
    const hits=[...NB.nodes.values()].filter(n=>n.name.toLowerCase().includes(q)).sort((a,b)=>(b.updated||0)-(a.updated||0));
    results.append(hits.length? el('div',{class:'nb-grid'}, hits.map(nodeTile)) : el('p',{class:'muted',text:'Rien trouvé pour « '+search.value+' ».'})); };
  search.addEventListener('input',drawResults);
  root.append(el('div',{style:{marginBottom:'16px'}},search), results); drawResults();
  return root;
}
function courseGrid(){
  return el('div',{class:'course-grid'}, courses().map(c=>{
    const n=nbNoteCount(c), q=nbStampsOf(c,'q').filter(x=>!x.s.done).length;
    const card=el('button',{type:'button',class:'course-card',onclick:()=>{ S.coursPath='c:'+c; S.coursTab='files'; render(); window.scrollTo(0,0); }},
      el('div',{class:'cc-name',text:c}),
      el('div',{class:'muted small',text: n+' note'+(n>1?'s':'')}),
      q? el('div',{class:'cc-q hand',text:q+' ? à revoir'}):'');
    card.style.setProperty('--cc',courseColor(c)); return card; }));
}
function crumbs(){
  const parts=[]; let p=S.coursPath, guard=0;
  while(p && !nbIsRoot(p) && guard++<50){ const n=NB.nodes.get(p); if(!n) break; parts.unshift(n); p=n.parent; }
  const course=nbIsRoot(p)?p.slice(2):'';
  const bc=el('div',{class:'crumbs'}, el('button',{type:'button',class:'crumb',text:'Cours',onclick:()=>{ S.coursPath=null; render(); }}), el('span',{class:'muted',text:'›'}),
    el('button',{type:'button',class:'crumb',text:shortCourse(course),onclick:()=>{ S.coursPath='c:'+course; render(); }}));
  parts.forEach(n=>bc.append(el('span',{class:'muted',text:'›'}), el('button',{type:'button',class:'crumb',text:n.name,onclick:()=>{ S.coursPath=n.id; render(); }})));
  return {el:bc, course};
}
function coursFolder(root){
  const {el:bc, course}=crumbs(); root.append(bc);
  const atRoot=nbIsRoot(S.coursPath);
  const title=atRoot?course:(NB.nodes.get(S.coursPath)||{}).name;
  const h=el('h2',{text:title}); h.style.setProperty('--cc',courseColor(course)); h.className='nb-title'; root.append(h);
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
    const n=await nbCreate('note',parent,f.name.replace(/\.pdf$/i,'')); const d={strokes:[],items:[],view:null};
    const k=await addPdfToDoc(d,f); if(!k){ await nbDeleteNode(n.id); return; }
    await nbPut('docs',d,n.id); toast(k+' page'+(k>1?'s':'')+' importée'+(k>1?'s':'')); openNote(n.id); });
  imgIn.addEventListener('change',async()=>{ const f=imgIn.files[0]; imgIn.value=''; if(!f) return;
    let blob; try{ blob=await recompress(f,2000,0.86,'image/jpeg'); }catch(e){ blob=f; }
    const im=await loadImage(blob).catch(()=>null); const ar=im?im.naturalHeight/im.naturalWidth:0.75; const key=await putBlob(blob);
    const n=await nbCreate('note',parent,'Photo du '+fmtDate(today())); await nbPut('docs',{strokes:[],items:[{id:uid(),kind:'img',blob:key,x:0,y:0,w:1000,h:Math.round(1000*ar)}],view:null},n.id); openNote(n.id); });
  root.append(el('div',{class:'row',style:{marginBottom:'16px'}},
    el('button',{class:'btn primary',type:'button',text:'＋ Note',onclick:async()=>{ const v=await promptBox('Nom de la note',dateName()); if(!v) return; const n=await nbCreate('note',parent,v); openNote(n.id); }}),
    el('button',{class:'btn',type:'button',text:'＋ Dossier',onclick:async()=>{ const v=await promptBox('Nom du dossier','Nouveau dossier'); if(!v) return; await nbCreate('folder',parent,v); render(); }}),
    el('button',{class:'btn',type:'button',text:'Importer un PDF',onclick:()=>pdfIn.click()}),
    el('button',{class:'btn ghost',type:'button',text:'Importer une photo',onclick:()=>imgIn.click()}), pdfIn, imgIn));
  const kids=nbChildren(parent);
  root.append(kids.length? el('div',{class:'nb-grid'}, kids.map(nodeTile))
    : el('div',{class:'card empty muted',text: atRoot?'Aucune note pour l’instant. Crée une note pour ton prochain cours, ou importe le PDF du polycopié.':'Ce dossier est vide.'}));
  return root;
}
function nodeTile(n){
  const isF=n.type==='folder';
  const thumb= isF ? el('div',{class:'nb-folder'}, el('span',{text:String(nbChildren(n.id).length)}))
    : el('div',{class:'nb-thumb'});
  if(!isF && n.thumb) nbBlobURL(n.thumb).then(u=>{ if(u) thumb.append(el('img',{src:u,alt:''})); });
  const q=(n.stamps||[]).filter(s=>s.t==='q'&&!s.done).length;
  const tile=el('div',{class:'nb-tile'+(isF?' is-folder':''),role:'button',tabindex:'0',onclick:()=>{ if(isF){ S.coursPath=n.id; render(); window.scrollTo(0,0); } else openNote(n.id); }},
    thumb,
    el('div',{class:'nb-meta'},
      el('div',{class:'nb-name',text:n.name}),
      el('div',{class:'muted small',text:(S.coursSearch&&!S.coursPath? shortCourse(nbCourseOf(n)||'')+' · ':'')+fmtDate(ymd(new Date(n.updated||Date.now())))+(q?' · '+q+' ?':'')})),
    el('button',{type:'button',class:'nb-more',title:'Options','aria-label':'Options',onclick:e=>{ e.stopPropagation(); nodeMenu(n); }},'⋯'));
  tile.addEventListener('keydown',e=>{ if(e.key==='Enter') tile.click(); });
  const c=nbCourseOf(n); if(c) tile.style.setProperty('--cc',courseColor(c));
  return tile;
}
function nodeMenu(n){
  let close;
  close=modal(el('div',{}, el('h3',{text:n.name}),
    el('div',{class:'row'},
      el('button',{class:'btn',type:'button',text:'Renommer',onclick:async()=>{ close(); const v=await promptBox('Nouveau nom',n.name); if(v){ n.name=v; await nbSaveNode(n); render(); } }}),
      el('button',{class:'btn',type:'button',text:'Déplacer',onclick:()=>{ close(); moveDialog(n); }}),
      el('button',{class:'btn danger ghost',type:'button',text:'Supprimer',onclick:async()=>{ close();
        const msg=n.type==='folder'?'Supprimer le dossier « '+n.name+' » et tout ce qu’il contient ?':'Supprimer la note « '+n.name+' » ?';
        if(await confirmBox(msg,'Supprimer')){ await nbDeleteNode(n.id); toast('Supprimé'); render(); } }}),
      el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Fermer',onclick:()=>close()}))));
}
function moveDialog(n){
  const banned=new Set([n.id, ...nbDescendantIds(n.id)]); let close;
  const list=el('div',{class:'move-list'});
  const add=(id,label,depth,color)=>{ const b=el('button',{type:'button',class:'move-row'+(n.parent===id?' here':''),style:{paddingLeft:(14+depth*22)+'px'},onclick:async()=>{ n.parent=id; await nbSaveNode(n); close(); toast('Déplacé'); render(); }}, label); if(color) b.style.setProperty('--cc',color); list.append(b); };
  const walk=(p,depth)=>{ for(const c of nbChildren(p)) if(c.type==='folder' && !banned.has(c.id)){ add(c.id,'▸ '+c.name,depth); walk(c.id,depth+1); } };
  courses().forEach(c=>{ add('c:'+c, c, 0, courseColor(c)); walk('c:'+c,1); });
  close=modal(el('div',{}, el('h3',{text:'Déplacer « '+n.name+' » vers…'}), list, el('div',{class:'row',style:{marginTop:'12px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',type:'button',text:'Annuler',onclick:()=>close()}))));
}
const snapCache=new Map();
function stampList(course, type){
  const list=nbStampsOf(course,type).filter(x=>type!=='q'||true).sort((a,b)=> type==='q' ? (a.s.done-b.s.done)||((b.node.updated||0)-(a.node.updated||0)) : 0);
  if(!list.length) return el('div',{class:'card empty muted',text: type==='q'?'Aucun passage marqué « pas compris ». Pendant le cours, pose un tampon ? dans la marge quand tu décroches.':type==='star'?'Aucun passage important marqué. Utilise le tampon ★ quand le prof insiste sur un point.':'Aucune formule marquée. Pose un tampon ƒ à côté des formules clés : elles apparaîtront toutes ici.'});
  const box=el('div',{class:'stamp-list'});
  for(const {node,s} of list){
    const img=el('div',{class:'st-snap'});
    const key=node.id+':'+s.id+':'+node.updated;
    const fill=u=>img.replaceChildren(el('img',{src:u,alt:''}));
    if(snapCache.has(key)) fill(snapCache.get(key));
    else nbGet('docs',node.id).then(async d=>{ if(!d) return; const b=await renderRegion(d.strokes||[], d.items||[], stampRect(s), 760); const u=URL.createObjectURL(b); snapCache.set(key,u); fill(u); });
    const st=STAMP[s.t]||STAMP.q;
    box.append(el('div',{class:'card st-row'+(s.done?' done':'')},
      el('div',{class:'row',style:{marginBottom:'8px'}}, el('span',{class:'stamp-ic',style:{background:s.done?'#1d8a4e':st.color},text:s.done?'✓':st.label}), el('b',{text:node.name}), el('span',{class:'muted small',text:fmtDate(ymd(new Date(node.updated||Date.now())))})),
      img,
      el('div',{class:'row',style:{marginTop:'10px'}},
        el('button',{class:'btn small',type:'button',text:'Ouvrir',onclick:()=>openNote(node.id,{x:s.x,y:s.y})}),
        type==='q'? el('button',{class:'btn small',type:'button',text:s.done?'Pas résolu':'Résolu ✓',onclick:()=>setStampDone(node,s.id,!s.done)}):'',
        el('button',{class:'btn small ghost',type:'button',text:'→ Carnet Replay',onclick:async()=>{ const d=await nbGet('docs',node.id); if(d) await sendRegionToReplay(node,d.strokes||[],d.items||[],stampRect(s)); }}))));
  }
  return box;
}
async function setStampDone(node, sid, done){
  const d=await nbGet('docs',node.id); if(!d) return;
  d.items=(d.items||[]).map(i=>i.id===sid?Object.assign({},i,{done}):i);
  await nbPut('docs',d,node.id);
  node.stamps=(node.stamps||[]).map(s=>s.id===sid?Object.assign({},s,{done}):s);
  await nbSaveNode(node); if(done) xpToast(10, nbCourseOf(node)||'Cours'); render();
}
