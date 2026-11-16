/* ---------------- modèles de page ---------------- */
export const TPLS=[['blank','Vierge'],['lines','Lignes'],['grid','Petits carreaux'],['seyes','Seyès'],['dots','Points'],['mm','Millimétré'],['cornell','Cornell']];
export const PAGE_A4={w:1000,h:1414}, PAGE_GAP=36;
export function drawTpl(ctx, tpl, R, s, vis, infinite){
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

