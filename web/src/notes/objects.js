import { strokeBox } from './geometry.js';

/* ---------------- objets : boîtes, texte ---------------- */
export const TEXT_FONTS={sans:'"Bricolage Grotesque", system-ui, sans-serif', hand:'Kalam, cursive', serif:'Georgia, serif'};
export function wrapText(ctx, text, maxW){
  const lines=[]; for(const para of String(text).split('\n')){ const words=para.split(/(\s+)/); let line='';
    for(const w of words){ const t=line+w; if(ctx.measureText(t).width>maxW && line.trim()){ lines.push(line.trimEnd()); line=w.trimStart(); } else line=t; }
    lines.push(line); }
  return lines;
}
export const MEASURE=document.createElement('canvas').getContext('2d');
export function textBox(it){ MEASURE.font=`${it.weight||500} ${it.size}px ${TEXT_FONTS[it.font]||TEXT_FONTS.sans}`; const lines=wrapText(MEASURE,it.text||' ',it.w); return {x:it.x,y:it.y,w:it.w,h:Math.max(it.size*1.35,lines.length*it.size*1.35)}; }
export function itemBox(it){
  if(it.kind==='text') return textBox(it);
  if(it.kind==='stamp') return {x:it.x-18,y:it.y-18,w:36,h:36};
  return {x:it.x,y:it.y,w:it.w,h:it.h};
}
export function unionBox(strokes, items){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const s of strokes){ const b=strokeBox(s); x0=Math.min(x0,b[0]); y0=Math.min(y0,b[1]); x1=Math.max(x1,b[2]); y1=Math.max(y1,b[3]); }
  for(const it of items){ const b=itemBox(it); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.w); y1=Math.max(y1,b.y+b.h); }
  return isFinite(x0)?{x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)}:null;
}

