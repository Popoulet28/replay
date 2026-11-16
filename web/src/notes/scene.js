import { bmpLoad, bmpNow, ensureLo } from './bitmaps.js';
import { drawStroke, strokeBox } from './geometry.js';
import { TEXT_FONTS, textBox, wrapText } from './objects.js';
import { hiresNow } from './pdf.js';
import { drawTpl } from './templates.js';

/* ---------------- dessin d'une scène ---------------- */
export const STAMP={q:{label:'?',color:'#d3302f',name:'Pas compris'}, star:{label:'★',color:'#c98a00',name:'Important'}, f:{label:'ƒ',color:'#1d2fa0',name:'Formule'}};
/* opts: {s, dpr, vis:[x0,y0,x1,y1], mode, tpl, exclude:Set, onAsset, stamps:bool, shadows:bool, hires:bool} */
export function drawScene(ctx, doc, opts){
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
export function drawImageItem(ctx, it, s, dpr, opts){
  const px=it.w*s*dpr; let bmp=null;
  const ready=opts.onAsset;
  if(it.pdf && opts.hires && px>1700*1.15) bmp=hiresNow(it, px, ready);
  if(!bmp && (px<=560) && it.lo) bmp=bmpNow(it.lo, ready);
  if(!bmp){ const full=bmpNow(it.img||it.blob, ready); if(full) bmp=full; else if(it.lo) bmp=bmpNow(it.lo, ready); }
  if(!it.lo) ensureLo(it, opts.onLo);
  if(bmp) ctx.drawImage(bmp, it.x, it.y, it.w, it.h);
  else if(it.kind==='img'){ ctx.fillStyle='#f1f0ea'; ctx.fillRect(it.x,it.y,it.w,it.h); }
}
export function drawTextItem(ctx, it){
  ctx.save(); ctx.font=`${it.weight||500} ${it.size}px ${TEXT_FONTS[it.font]||TEXT_FONTS.sans}`; ctx.fillStyle=it.color||'#16182a'; ctx.textBaseline='top';
  const lines=wrapText(ctx, it.text||'', it.w); lines.forEach((l,i)=>ctx.fillText(l, it.x, it.y+i*it.size*1.35+it.size*0.12)); ctx.restore();
}
export function drawStampItem(ctx, it, s){
  const st=STAMP[it.stamp]||STAMP.q, done=it.stamp==='q'&&it.done, r=16/Math.max(0.35,Math.min(s,2.5));
  ctx.save(); ctx.beginPath(); ctx.arc(it.x,it.y,r,0,Math.PI*2); ctx.fillStyle=done?'#1d8a4e':st.color; ctx.fill();
  ctx.lineWidth=r*0.18; ctx.strokeStyle='#fff'; ctx.stroke(); ctx.beginPath(); ctx.arc(it.x,it.y,r*1.24,0,Math.PI*2); ctx.lineWidth=r*0.09; ctx.strokeStyle=done?'#1d8a4e':st.color; ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font=`700 ${r*1.15}px Kalam, "Bricolage Grotesque", sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(done?'✓':st.label, it.x, it.y+r*0.06); ctx.restore();
}
/* rendu hors écran d'une zone (vignettes, export, envoi au carnet) */
export async function preloadAssets(doc, rect, outPx){
  const jobs=[];
  for(const it of doc.items){ if(!(it.kind==='page'&&it.img) && it.kind!=='img') continue;
    if(it.x>rect.x+rect.w||it.y>rect.y+rect.h||it.x+it.w<rect.x||it.y+it.h<rect.y) continue;
    const px=it.w*outPx/rect.w; const key=(px<=560&&it.lo)?it.lo:(it.img||it.blob); jobs.push(bmpLoad(key)); }
  await Promise.all(jobs);
}
export async function renderRegion(doc, rect, outW, opts){
  const sc=outW/rect.w, outH=Math.max(1,Math.min(4200,Math.round(rect.h*sc)));
  await preloadAssets(doc, rect, outW);
  const c=document.createElement('canvas'); c.width=Math.round(outW); c.height=outH;
  const x=c.getContext('2d'); x.fillStyle=(opts&&opts.bg)||'#fffefa'; x.fillRect(0,0,c.width,c.height);
  x.setTransform(sc,0,0,sc,-rect.x*sc,-rect.y*sc);
  drawScene(x, doc, {s:sc, dpr:1, vis:[rect.x,rect.y,rect.x+rect.w,rect.y+rect.h], stamps:!(opts&&opts.noStamps), shadows:false});
  if(opts && opts.canvas) return c;
  return await new Promise(r=>c.toBlob(r,'image/jpeg',(opts&&opts.q)||0.86));
}

