/* =====================================================================
   Cours v2 — moteur d'encre, pages, PDF  (partie 1 : stockage + rendu)
   ===================================================================== */
const NB = { db:null, nodes:new Map(), ready:false, loading:null, urls:new Map(), editor:null, clip:null };
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
const nbKeys=s=>nbTx(s,'readonly',st=>st.getAllKeys());
const nbClear=s=>nbTx(s,'readwrite',st=>st.clear());
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
function nbCourseOf(n){ let x=n, g=0; while(x && !nbIsRoot(x.parent) && g++<60) x=NB.nodes.get(x.parent); return x && nbIsRoot(x.parent) ? x.parent.slice(2) : null; }
function nbSort(list){
  const by=S.settings.nbSort||'recent';
  return list.sort((a,b)=> (a.type===b.type?0:(a.type==='folder'?-1:1)) || (by==='name' ? a.name.localeCompare(b.name,'fr',{numeric:true}) : (b.updated||0)-(a.updated||0)));
}
function nbChildren(parent){ return nbSort([...NB.nodes.values()].filter(n=>n.parent===parent)); }
function nbDescendantIds(id){ const out=[]; const walk=p=>{ for(const c of nbChildren(p)){ out.push(c.id); if(c.type==='folder') walk(c.id); } }; walk(id); return out; }
async function nbSaveNode(n, keepDate){ if(!keepDate) n.updated=Date.now(); NB.nodes.set(n.id,n); await nbPut('nodes',n); }
async function nbCreate(type, parent, name, extra){
  const n=Object.assign({id:(type==='folder'?'f':'n')+uid().slice(1), type, parent, name, created:today(), createdAt:Date.now(), updated:Date.now(), stamps:[]}, extra||{});
  await nbSaveNode(n); return n;
}
function docBlobKeys(d){
  const keys=new Set();
  for(const it of (d&&d.items)||[]) for(const k of ['img','lo','blob','pdf']) if(it[k]) keys.add(it[k]);
  return keys;
}
async function nbDeleteNode(id){
  const n=NB.nodes.get(id); if(!n) return;
  for(const c of nbChildren(id)) await nbDeleteNode(c.id);
  if(n.type==='note'){
    const d=await nbGet('docs',id);
    for(const k of docBlobKeys(d)){ await nbDel('blobs',k); nbForget(k); }
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
async function putBlob(blob, prefix){ const key=(prefix||'b:')+uid(); await nbPut('blobs',blob,key); return key; }

/* ---------------- réglages de l'encre ---------------- */
const INK_DEFAULT={ pen:{type:'fountain', size:2.4, color:'#1d2fa0'}, hl:{color:'#ffe94d', size:18, straight:true},
  eraser:{mode:'stroke', size:16, hlOnly:false}, shape:{color:'#16182a', size:2.4}, text:{size:22, color:'#16182a', font:'sans'},
  finger:false, penButton:true, gestures:true, recent:[] };
function inkPrefs(){ const s=S.settings; if(!s.ink) s.ink=clone(INK_DEFAULT); for(const k in INK_DEFAULT) if(s.ink[k]===undefined) s.ink[k]=clone(INK_DEFAULT[k]); return s.ink; }
let inkSaveT=null; function inkPrefsChanged(){ clearTimeout(inkSaveT); inkSaveT=setTimeout(()=>saveSettings(),600); }
const PEN_COLORS=['#1d2fa0','#16182a','#d3302f','#1d8a4e','#7a3fc4','#e07020','#2f8fd8','#8b8f9f'];
const HL_COLORS=['#ffe94d','#9cf0a0','#ffa3cf','#9cd3ff','#ffc27a'];
const PEN_SIZES=[1.4,2.4,4.2], HL_SIZES=[11,18,28], ER_SIZES=[8,16,34];
const PENS={ fountain:{name:'Plume', thin:0.62, stream:0.42, taper:true}, ball:{name:'Bille', thin:0.12, stream:0.5, taper:false}, brush:{name:'Pinceau', thin:0.9, stream:0.32, taper:true} };

/* ---------------- images : bitmaps décodés, cache LRU ---------------- */
const BMP={map:new Map(), px:0, LIMIT:42e6};
function bmpEvict(){ for(const [k,e] of BMP.map){ if(BMP.px<=BMP.LIMIT) break; if(!e.bmp) continue; BMP.map.delete(k); BMP.px-=e.px; try{ e.bmp.close(); }catch(_){} } }
function bmpLoad(key){
  let e=BMP.map.get(key);
  if(e){ BMP.map.delete(key); BMP.map.set(key,e); return e.p; }
  e={bmp:null, px:0, p:null}; BMP.map.set(key,e);
  e.p=nbGet('blobs',key).then(b=>b?createImageBitmap(b):null).catch(()=>null).then(bmp=>{ e.bmp=bmp; if(bmp){ e.px=bmp.width*bmp.height; BMP.px+=e.px; bmpEvict(); } return bmp; });
  return e.p;
}
function bmpNow(key, onReady){
  if(!key) return null; const e=BMP.map.get(key);
  if(e && e.bmp){ BMP.map.delete(key); BMP.map.set(key,e); return e.bmp; }
  bmpLoad(key).then(b=>{ if(b && onReady) onReady(); }); return null;
}
/* version basse résolution (vignettes, dézoom) générée une fois */
const LO_PENDING=new Set();
function ensureLo(it, onDone){
  if(it.lo || LO_PENDING.has(it.id)) return; const src=it.img||it.blob; if(!src) return; LO_PENDING.add(it.id);
  (async()=>{ const b=await nbGet('blobs',src); if(!b) return; const bmp=await createImageBitmap(b);
    const w=Math.min(520,bmp.width), h=Math.round(bmp.height*w/bmp.width); const c=document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(bmp,0,0,w,h); bmp.close();
    const lb=await new Promise(r=>c.toBlob(r,'image/jpeg',0.82)); it.lo=await putBlob(lb,'lo:'); onDone&&onDone(); })().catch(e=>console.warn('lo',e)).finally(()=>LO_PENDING.delete(it.id));
}

/* ---------------- PDF ---------------- */
let PDFJS=null;
async function loadModuleLib(path){ const src=await (await fetch(path)).text(); return import(URL.createObjectURL(new Blob([src],{type:'text/javascript'}))); }
async function loadPdfJs(){
  if(PDFJS) return PDFJS;
  const mod=await loadModuleLib('lib/pdf.min.mjs');
  const wsrc=await (await fetch('lib/pdf.worker.min.mjs')).text();
  mod.GlobalWorkerOptions.workerPort=new Worker(URL.createObjectURL(new Blob([wsrc],{type:'text/javascript'})),{type:'module'});
  PDFJS=mod; return mod;
}
const LIBS={};
function loadScriptLib(path, global){
  if(LIBS[path]) return LIBS[path];
  LIBS[path]=fetch(path).then(r=>r.text()).then(src=>new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=URL.createObjectURL(new Blob([src],{type:'text/javascript'})); s.onload=()=>res(window[global]); s.onerror=rej; document.head.append(s); }));
  return LIBS[path];
}
const PDFDOCS=new Map();
function pdfDocFor(key){
  if(!PDFDOCS.has(key)) PDFDOCS.set(key,(async()=>{ const pdfjs=await loadPdfJs(); const b=await nbGet('blobs',key); return pdfjs.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise; })());
  return PDFDOCS.get(key);
}
async function pdfRenderCanvas(pdf, index, width){
  const page=await pdf.getPage(index); const v1=page.getViewport({scale:1}); const vp=page.getViewport({scale:width/v1.width});
  const c=document.createElement('canvas'); c.width=Math.round(vp.width); c.height=Math.round(vp.height);
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  await page.render({canvasContext:x, viewport:vp}).promise; page.cleanup(); return c;
}
/* pages nettes au zoom : rendu vectoriel à la demande */
const HIRES={map:new Map(), busy:false, queue:[]};
function hiresNow(it, wantPx, onReady){
  const k=it.pdf+'#'+it.pi; const e=HIRES.map.get(k);
  if(e && e.bmp && e.w>=wantPx*0.85){ HIRES.map.delete(k); HIRES.map.set(k,e); return e.bmp; }
  if(!HIRES.queue.find(q=>q.k===k)){ HIRES.queue.push({k, it, w:Math.min(4200,Math.round(wantPx*1.1)), onReady}); pumpHires(); }
  return e && e.bmp ? e.bmp : null;
}
async function pumpHires(){
  if(HIRES.busy) return; const job=HIRES.queue.pop(); HIRES.queue.length=0; if(!job) return; HIRES.busy=true;
  try{ const pdf=await pdfDocFor(job.it.pdf); const c=await pdfRenderCanvas(pdf, job.it.pi, job.w); const bmp=await createImageBitmap(c);
    const old=HIRES.map.get(job.k); if(old&&old.bmp) old.bmp.close();
    HIRES.map.set(job.k,{bmp, w:c.width}); while(HIRES.map.size>4){ const [k0,e0]=HIRES.map.entries().next().value; HIRES.map.delete(k0); e0.bmp&&e0.bmp.close(); }
    job.onReady&&job.onReady(); }
  catch(e){ console.warn('hires',e); }
  HIRES.busy=false; if(HIRES.queue.length) pumpHires();
}
function progressBox(text){
  const label=el('div',{class:'res-big',text}); const bar=ruler(0);
  const close=modal(el('div',{}, label, el('div',{style:{marginTop:'12px'}},bar)));
  return {set:(t,f)=>{ label.textContent=t; bar.querySelector('i').style.width=Math.round(f*100)+'%'; }, close};
}
/* importe un PDF en pages ; renvoie les nouvelles pages (sans position) */
async function pdfToPages(file){
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

/* ---------------- modèles de page ---------------- */
const TPLS=[['blank','Vierge'],['lines','Lignes'],['grid','Petits carreaux'],['seyes','Seyès'],['dots','Points'],['mm','Millimétré'],['cornell','Cornell']];
const PAGE_A4={w:1000,h:1414}, PAGE_GAP=36;
function drawTpl(ctx, tpl, R, s, vis, infinite){
  // R: rectangle monde de la page (ou de la zone visible en mode infini)
  const x0=Math.max(R.x,vis[0]), x1=Math.min(R.x+R.w,vis[2]), y0=Math.max(R.y,vis[1]), y1=Math.min(R.y+R.h,vis[3]);
  if(x0>=x1||y0>=y1||tpl==='blank') return;
  const ox=infinite?0:R.x, oy=infinite?0:R.y, lw=1/s;
  const H=(step,col,off,from)=>{ if(step*s<3) return; ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); const base=oy+(off||0); let k=Math.ceil((Math.max(y0,from==null?-1e9:from)-base)/step); for(let y=base+k*step;y<=y1;y+=step){ ctx.moveTo(x0,y); ctx.lineTo(x1,y); } ctx.stroke(); };
  const V=(step,col,off,from)=>{ if(step*s<3) return; ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); const base=ox+(off||0); let k=Math.ceil((Math.max(x0,from==null?-1e9:from)-base)/step); for(let x=base+k*step;x<=x1;x+=step){ ctx.moveTo(x,y0); ctx.lineTo(x,y1); } ctx.stroke(); };
  const vline=(x,col,w)=>{ if(x<x0||x>x1) return; ctx.strokeStyle=col; ctx.lineWidth=(w||1.4)/s; ctx.beginPath(); ctx.moveTo(x,y0); ctx.lineTo(x,y1); ctx.stroke(); };
  const mm=4.76;
  switch(tpl){
    case 'lines': H(8*mm,'#c7d3ec',0,infinite?null:oy+24*mm); if(!infinite) vline(ox+25*mm,'#ef9aa0'); break;
    case 'grid': H(5*mm,'#d5def0'); V(5*mm,'#d5def0'); break;
    case 'seyes': H(2*mm,'#dde3f3'); H(8*mm,'#9fb1de'); V(8*mm,'#dde3f3'); if(!infinite) vline(ox+40*mm,'#ef9aa0'); break;
    case 'dots': { const st=5*mm; if(st*s<5) break; ctx.fillStyle='#b8c3dc'; const r=Math.max(0.9/s,0.9); let i0=Math.ceil((x0-ox)/st), j0=Math.ceil((y0-oy)/st);
      for(let x=ox+i0*st;x<=x1;x+=st) for(let y=oy+j0*st;y<=y1;y+=st) ctx.fillRect(x-r,y-r,2*r,2*r); break; }
    case 'mm': H(mm,'#f7d9c6'); V(mm,'#f7d9c6'); H(5*mm,'#efbd9c'); V(5*mm,'#efbd9c'); H(10*mm,'#e59a6c'); V(10*mm,'#e59a6c'); break;
    case 'cornell': if(infinite){ H(8*mm,'#c7d3ec'); break; } H(8*mm,'#c7d3ec',0,oy+30*mm); ctx.strokeStyle='#9fb1de'; ctx.lineWidth=1.6/s; ctx.beginPath();
      ctx.moveTo(Math.max(x0,ox),oy+26*mm); ctx.lineTo(Math.min(x1,ox+R.w),oy+26*mm); ctx.moveTo(ox+62*mm,Math.max(y0,oy+26*mm)); ctx.lineTo(ox+62*mm,Math.min(y1,oy+R.h-48*mm));
      ctx.moveTo(Math.max(x0,ox),oy+R.h-48*mm); ctx.lineTo(Math.min(x1,ox+R.w),oy+R.h-48*mm); ctx.stroke(); break;
  }
}

/* ---------------- géométrie de l'encre ---------------- */
const OUTLINE=new WeakMap();
function strokeBox(st){
  let c=OUTLINE.get(st); if(c && c.b) return c.b;
  const a=st.pts; let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<a.length;i+=3){ const x=a[i],y=a[i+1]; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  const m=st.size*0.8+1; const b=[x0-m,y0-m,x1+m,y1+m];
  c=c||{}; c.b=b; OUTLINE.set(st,c); return b;
}
/* contour à largeur variable (style « encre » lissée) */
function outlinePoints(a, size, penType, isPen){
  const pr=PENS[penType]||PENS.ball, n=a.length/3;
  const P=[]; let px=a[0], py=a[1], pp=a[2];
  for(let i=0;i<n;i++){ const x=a[3*i], y=a[3*i+1], p=a[3*i+2]; if(i===0){ px=x; py=y; pp=p; } else { const k=1-pr.stream; px+=(x-px)*k; py+=(y-py)*k; pp+=(p-pp)*0.35; } P.push([px,py,pp]); }
  if(n>1) P.push([a[3*n-3],a[3*n-2],P[P.length-1][2]]);
  const m=P.length;
  if(m===1){ const r=size/2; const out=[]; for(let k=0;k<16;k++){ const t=k/16*Math.PI*2; out.push([P[0][0]+Math.cos(t)*r,P[0][1]+Math.sin(t)*r]); } return out; }
  let total=0; const L=[0]; for(let i=1;i<m;i++){ total+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); L.push(total); }
  const taperLen=pr.taper?Math.min(total*0.25,size*6):0;
  const R=P.map((q,i)=>{ const pe=Math.sin(Math.min(1,Math.max(0.05,q[2]))*Math.PI/2); let r=(size/2)*(1-pr.thin*(1-pe)); r=Math.max(r,size*0.12);
    if(taperLen>0){ const ts=Math.min(1,L[i]/taperLen), te=Math.min(1,(total-L[i])/taperLen); r*=Math.min(0.35+0.65*ts, 0.15+0.85*te); } return r; });
  const left=[], right=[]; let nx=0, ny=-1;
  for(let i=0;i<m;i++){
    const a0=P[Math.max(0,i-1)], a1=P[Math.min(m-1,i+1)]; let dx=a1[0]-a0[0], dy=a1[1]-a0[1]; const d=Math.hypot(dx,dy);
    if(d>1e-6){ nx=-dy/d; ny=dx/d; }
    left.push([P[i][0]+nx*R[i], P[i][1]+ny*R[i]]); right.push([P[i][0]-nx*R[i], P[i][1]-ny*R[i]]);
  }
  const cap=(c,r,from,steps)=>{ const out=[]; for(let k=1;k<steps;k++){ const t=from+Math.PI*k/steps; out.push([c[0]+Math.cos(t)*r,c[1]+Math.sin(t)*r]); } return out; };
  const e=P[m-1], s0=P[0];
  const endAng=Math.atan2(left[m-1][1]-e[1], left[m-1][0]-e[0]);
  const startAng=Math.atan2(right[0][1]-s0[1], right[0][0]-s0[0]);
  return left.concat(cap(e,R[m-1],endAng,7), right.reverse(), cap(s0,R[0],startAng,7));
}
function polyPath(pts){
  const p=new Path2D(), n=pts.length; if(n<3){ return p; }
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let m0=mid(pts[n-1],pts[0]); p.moveTo(m0[0],m0[1]);
  for(let i=0;i<n;i++){ const c=pts[i], m=mid(c,pts[(i+1)%n]); p.quadraticCurveTo(c[0],c[1],m[0],m[1]); }
  p.closePath(); return p;
}
function strokePath(st){
  let c=OUTLINE.get(st); if(c && c.p) return c.p;
  c=c||{}; const a=st.pts;
  if(st.tool==='hl'){ const p=new Path2D(); p.moveTo(a[0],a[1]); for(let i=3;i<a.length;i+=3) p.lineTo(a[i],a[i+1]); if(a.length===3) p.lineTo(a[0]+0.01,a[1]); c.p=p; }
  else c.p=polyPath(outlinePoints(a, st.size, st.pen, true));
  OUTLINE.set(st,c); return c.p;
}
function drawStroke(ctx, st, path){
  const p=path||strokePath(st);
  if(st.tool==='hl'){ ctx.save(); ctx.globalAlpha=0.42; ctx.globalCompositeOperation='multiply'; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=st.color; ctx.lineWidth=st.size; ctx.stroke(p); ctx.restore(); }
  else { ctx.fillStyle=st.color; ctx.fill(p); }
}
/* reconnaissance de formes */
function rdp(P, eps){
  if(P.length<3) return P.slice();
  let dmax=0, idx=0; const [a,b]=[P[0],P[P.length-1]];
  for(let i=1;i<P.length-1;i++){ const d=segDist(P[i],a,b); if(d>dmax){ dmax=d; idx=i; } }
  if(dmax>eps){ const l=rdp(P.slice(0,idx+1),eps), r=rdp(P.slice(idx),eps); return l.slice(0,-1).concat(r); }
  return [a,b];
}
function segDist(p,a,b){ const dx=b[0]-a[0], dy=b[1]-a[1]; const l=dx*dx+dy*dy; let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(a[0]+t*dx-p[0], a[1]+t*dy-p[1]); }
function recognizeShape(a){
  const P=[]; for(let i=0;i<a.length;i+=3) P.push([a[i],a[i+1]]); const n=P.length; if(n<5) return null;
  let len=0; for(let i=1;i<n;i++) len+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity; for(const p of P){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); y0=Math.min(y0,p[1]); y1=Math.max(y1,p[1]); }
  const diag=Math.hypot(x1-x0,y1-y0); if(diag<12) return null;
  const ends=Math.hypot(P[n-1][0]-P[0][0],P[n-1][1]-P[0][1]);
  if(ends/len>0.9) return {type:'line', pts:[P[0],P[n-1]]};
  if(ends<0.3*diag){
    const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.max(1,(x1-x0)/2), ry=Math.max(1,(y1-y0)/2);
    let err=0; for(const p of P){ err+=Math.abs(Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)-1); } err/=n;
    let simp=rdp(P.concat([P[0]]), 0.08*diag); if(simp.length>1 && Math.hypot(simp[0][0]-simp[simp.length-1][0],simp[0][1]-simp[simp.length-1][1])<0.15*diag) simp=simp.slice(0,-1);
    if(simp.length===3 && err>0.08) return {type:'poly', pts:simp};
    if(simp.length===4 && err>0.08){
      const axis=simp.every((p,i)=>{ const q=simp[(i+1)%4]; const ang=Math.abs(Math.atan2(q[1]-p[1],q[0]-p[0])); const m=ang%(Math.PI/2); return m<0.25||m>Math.PI/2-0.25; });
      return axis? {type:'poly', pts:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]} : {type:'poly', pts:simp};
    }
    if(err<0.2) return {type:'ellipse', cx, cy, rx, ry};
  }
  return null;
}
function shapeToPts(sh, p){
  const out=[]; const push=(x,y)=>out.push(Math.round(x*10)/10,Math.round(y*10)/10,p);
  const seg=(a,b)=>{ const L=Math.hypot(b[0]-a[0],b[1]-a[1]); const k=Math.max(1,Math.ceil(L/6)); for(let i=0;i<k;i++) push(a[0]+(b[0]-a[0])*i/k, a[1]+(b[1]-a[1])*i/k); };
  if(sh.type==='line'){ seg(sh.pts[0],sh.pts[1]); push(sh.pts[1][0],sh.pts[1][1]); }
  else if(sh.type==='poly'){ const q=sh.pts; for(let i=0;i<q.length;i++) seg(q[i],q[(i+1)%q.length]); push(q[0][0],q[0][1]); }
  else if(sh.type==='ellipse'){ const k=Math.max(24,Math.ceil(Math.PI*(sh.rx+sh.ry)/6)); for(let i=0;i<=k;i++){ const t=i/k*Math.PI*2; push(sh.cx+Math.cos(t)*sh.rx, sh.cy+Math.sin(t)*sh.ry); } }
  return out;
}
/* gomme précise : coupe le trait */
function splitStroke(st, wx, wy, r){
  const a=st.pts, R=r+st.size*0.5, R2=R*R; const b=strokeBox(st);
  if(wx<b[0]-r||wx>b[2]+r||wy<b[1]-r||wy>b[3]+r) return null;
  const pts=[]; for(let i=0;i<a.length;i+=3){ if(i>0){ const px=a[i-3],py=a[i-2],x=a[i],y=a[i+1]; const L=Math.hypot(x-px,y-py); const k=Math.floor(L/(R*0.5)); for(let j=1;j<k;j++) pts.push([px+(x-px)*j/k, py+(y-py)*j/k, a[i+2]]); } pts.push([a[i],a[i+1],a[i+2]]); }
  let hit=false; const keep=pts.map(p=>{ const o=(p[0]-wx)**2+(p[1]-wy)**2>R2; if(!o) hit=true; return o; });
  if(!hit) return null;
  const out=[]; let run=[];
  const flush=()=>{ if(run.length>=2) out.push(Object.assign({},st,{id:uid(), pts:run.flat()})); run=[]; };
  pts.forEach((p,i)=>{ if(keep[i]) run.push([Math.round(p[0]*10)/10,Math.round(p[1]*10)/10,p[2]]); else flush(); }); flush();
  return out;
}
function hitStroke(st, wx, wy, r){
  const b=strokeBox(st); if(wx<b[0]-r||wx>b[2]+r||wy<b[1]-r||wy>b[3]+r) return false;
  const a=st.pts, R=r+st.size/2;
  if(a.length===3) return Math.hypot(a[0]-wx,a[1]-wy)<=R;
  for(let i=3;i<a.length;i+=3) if(segDist([wx,wy],[a[i-3],a[i-2]],[a[i],a[i+1]])<=R) return true;
  return false;
}
function pointInPoly(x,y,poly){ let ins=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1]; if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins; } return ins; }

/* ---------------- objets : boîtes, texte ---------------- */
const TEXT_FONTS={sans:'"Bricolage Grotesque", system-ui, sans-serif', hand:'Kalam, cursive', serif:'Georgia, serif'};
function wrapText(ctx, text, maxW){
  const lines=[]; for(const para of String(text).split('\n')){ const words=para.split(/(\s+)/); let line='';
    for(const w of words){ const t=line+w; if(ctx.measureText(t).width>maxW && line.trim()){ lines.push(line.trimEnd()); line=w.trimStart(); } else line=t; }
    lines.push(line); }
  return lines;
}
const MEASURE=document.createElement('canvas').getContext('2d');
function textBox(it){ MEASURE.font=`${it.weight||500} ${it.size}px ${TEXT_FONTS[it.font]||TEXT_FONTS.sans}`; const lines=wrapText(MEASURE,it.text||' ',it.w); return {x:it.x,y:it.y,w:it.w,h:Math.max(it.size*1.35,lines.length*it.size*1.35)}; }
function itemBox(it){
  if(it.kind==='text') return textBox(it);
  if(it.kind==='stamp') return {x:it.x-18,y:it.y-18,w:36,h:36};
  return {x:it.x,y:it.y,w:it.w,h:it.h};
}
function unionBox(strokes, items){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const s of strokes){ const b=strokeBox(s); x0=Math.min(x0,b[0]); y0=Math.min(y0,b[1]); x1=Math.max(x1,b[2]); y1=Math.max(y1,b[3]); }
  for(const it of items){ const b=itemBox(it); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.w); y1=Math.max(y1,b.y+b.h); }
  return isFinite(x0)?{x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)}:null;
}

/* ---------------- dessin d'une scène ---------------- */
const STAMP={q:{label:'?',color:'#d3302f',name:'Pas compris'}, star:{label:'★',color:'#c98a00',name:'Important'}, f:{label:'ƒ',color:'#1d2fa0',name:'Formule'}};
/* opts: {s, dpr, vis:[x0,y0,x1,y1], mode, tpl, exclude:Set, onAsset, stamps:bool, shadows:bool, hires:bool} */
function drawScene(ctx, doc, opts){
  const {s, vis}=opts, dpr=opts.dpr||1, ex=opts.exclude;
  const inV=b=>!(b.x>vis[2]||b.y>vis[3]||b.x+b.w<vis[0]||b.y+b.h<vis[1]);
  if(doc.mode==='infinite' && doc.tpl && doc.tpl!=='blank') drawTpl(ctx, doc.tpl, {x:vis[0],y:vis[1],w:vis[2]-vis[0],h:vis[3]-vis[1]}, s, vis, true);
  for(const it of doc.items){
    if(it.kind!=='page' || (ex&&ex.has(it))) continue; if(!inV(it)) continue;
    if(opts.shadows){ ctx.fillStyle='rgba(22,24,42,.07)'; ctx.fillRect(it.x+3/s,it.y+4/s,it.w,it.h); }
    ctx.fillStyle='#ffffff'; ctx.fillRect(it.x,it.y,it.w,it.h);
    if(it.img) drawImageItem(ctx, it, s, dpr, opts); else drawTpl(ctx, it.tpl||'blank', it, s, vis, false);
    if(opts.shadows){ ctx.strokeStyle='rgba(22,24,42,.14)'; ctx.lineWidth=1/s; ctx.strokeRect(it.x,it.y,it.w,it.h); }
    if(it.bm && opts.stamps){ ctx.fillStyle='#d3302f'; const bw=18/Math.max(s,0.4); ctx.beginPath(); ctx.moveTo(it.x+it.w-bw*2.4,it.y); ctx.lineTo(it.x+it.w-bw*1.2,it.y); ctx.lineTo(it.x+it.w-bw*1.2,it.y+bw*2.2); ctx.lineTo(it.x+it.w-bw*1.8,it.y+bw*1.6); ctx.lineTo(it.x+it.w-bw*2.4,it.y+bw*2.2); ctx.closePath(); ctx.fill(); }
  }
  for(const it of doc.items){ if(it.kind!=='img' || (ex&&ex.has(it)) || !inV(it)) continue; drawImageItem(ctx, it, s, dpr, opts); }
  const V=[vis[0],vis[1],vis[2],vis[3]];
  for(const pass of ['hl','pen']) for(const st of doc.strokes){
    if(st.tool!==pass || (ex&&ex.has(st))) continue; const b=strokeBox(st);
    if(b[0]>V[2]||b[2]<V[0]||b[1]>V[3]||b[3]<V[1]) continue; drawStroke(ctx, st);
  }
  for(const it of doc.items){ if(it.kind!=='text' || (ex&&ex.has(it)) || !inV(textBox(it))) continue; drawTextItem(ctx,it); }
  if(opts.stamps!==false) for(const it of doc.items){ if(it.kind!=='stamp' || (ex&&ex.has(it))) continue; drawStampItem(ctx,it,s); }
}
function drawImageItem(ctx, it, s, dpr, opts){
  const px=it.w*s*dpr; let bmp=null;
  const ready=opts.onAsset;
  if(it.pdf && opts.hires && px>1700*1.15) bmp=hiresNow(it, px, ready);
  if(!bmp && (px<=560) && it.lo) bmp=bmpNow(it.lo, ready);
  if(!bmp){ const full=bmpNow(it.img||it.blob, ready); if(full) bmp=full; else if(it.lo) bmp=bmpNow(it.lo, ready); }
  if(!it.lo) ensureLo(it, opts.onLo);
  if(bmp) ctx.drawImage(bmp, it.x, it.y, it.w, it.h);
  else if(it.kind==='img'){ ctx.fillStyle='#f1f0ea'; ctx.fillRect(it.x,it.y,it.w,it.h); }
}
function drawTextItem(ctx, it){
  ctx.save(); ctx.font=`${it.weight||500} ${it.size}px ${TEXT_FONTS[it.font]||TEXT_FONTS.sans}`; ctx.fillStyle=it.color||'#16182a'; ctx.textBaseline='top';
  const lines=wrapText(ctx, it.text||'', it.w); lines.forEach((l,i)=>ctx.fillText(l, it.x, it.y+i*it.size*1.35+it.size*0.12)); ctx.restore();
}
function drawStampItem(ctx, it, s){
  const st=STAMP[it.stamp]||STAMP.q, done=it.stamp==='q'&&it.done, r=16/Math.max(0.35,Math.min(s,2.5));
  ctx.save(); ctx.beginPath(); ctx.arc(it.x,it.y,r,0,Math.PI*2); ctx.fillStyle=done?'#1d8a4e':st.color; ctx.fill();
  ctx.lineWidth=r*0.18; ctx.strokeStyle='#fff'; ctx.stroke(); ctx.beginPath(); ctx.arc(it.x,it.y,r*1.24,0,Math.PI*2); ctx.lineWidth=r*0.09; ctx.strokeStyle=done?'#1d8a4e':st.color; ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font=`700 ${r*1.15}px Kalam, "Bricolage Grotesque", sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(done?'✓':st.label, it.x, it.y+r*0.06); ctx.restore();
}
/* rendu hors écran d'une zone (vignettes, export, envoi au carnet) */
async function preloadAssets(doc, rect, outPx){
  const jobs=[];
  for(const it of doc.items){ if(!(it.kind==='page'&&it.img) && it.kind!=='img') continue;
    if(it.x>rect.x+rect.w||it.y>rect.y+rect.h||it.x+it.w<rect.x||it.y+it.h<rect.y) continue;
    const px=it.w*outPx/rect.w; const key=(px<=560&&it.lo)?it.lo:(it.img||it.blob); jobs.push(bmpLoad(key)); }
  await Promise.all(jobs);
}
async function renderRegion(doc, rect, outW, opts){
  const sc=outW/rect.w, outH=Math.max(1,Math.min(4200,Math.round(rect.h*sc)));
  await preloadAssets(doc, rect, outW);
  const c=document.createElement('canvas'); c.width=Math.round(outW); c.height=outH;
  const x=c.getContext('2d'); x.fillStyle=(opts&&opts.bg)||'#fffefa'; x.fillRect(0,0,c.width,c.height);
  x.setTransform(sc,0,0,sc,-rect.x*sc,-rect.y*sc);
  drawScene(x, doc, {s:sc, dpr:1, vis:[rect.x,rect.y,rect.x+rect.w,rect.y+rect.h], stamps:!(opts&&opts.noStamps), shadows:false});
  if(opts && opts.canvas) return c;
  return await new Promise(r=>c.toBlob(r,'image/jpeg',(opts&&opts.q)||0.86));
}
