import { uid } from '../core/helpers.js';
import { PENS } from './prefs.js';

/* ---------------- géométrie de l'encre ---------------- */
export const OUTLINE=new WeakMap();
export function strokeBox(st){
  let c=OUTLINE.get(st); if(c && c.b) return c.b;
  const a=st.pts; let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=0;i<a.length;i+=3){ const x=a[i],y=a[i+1]; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  const m=st.size*0.8+1; const b=[x0-m,y0-m,x1+m,y1+m];
  c=c||{}; c.b=b; OUTLINE.set(st,c); return b;
}
/* contour à largeur variable (style « encre » lissée) */
export function outlinePoints(a, size, penType, isPen){
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
export function polyPath(pts){
  const p=new Path2D(), n=pts.length; if(n<3){ return p; }
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let m0=mid(pts[n-1],pts[0]); p.moveTo(m0[0],m0[1]);
  for(let i=0;i<n;i++){ const c=pts[i], m=mid(c,pts[(i+1)%n]); p.quadraticCurveTo(c[0],c[1],m[0],m[1]); }
  p.closePath(); return p;
}
export function strokePath(st){
  let c=OUTLINE.get(st); if(c && c.p) return c.p;
  c=c||{}; const a=st.pts;
  if(st.tool==='hl'){ const p=new Path2D(); p.moveTo(a[0],a[1]); for(let i=3;i<a.length;i+=3) p.lineTo(a[i],a[i+1]); if(a.length===3) p.lineTo(a[0]+0.01,a[1]); c.p=p; }
  else c.p=polyPath(outlinePoints(a, st.size, st.pen, true));
  OUTLINE.set(st,c); return c.p;
}
export function drawStroke(ctx, st, path){
  const p=path||strokePath(st);
  if(st.tool==='hl'){ ctx.save(); ctx.globalAlpha=0.42; ctx.globalCompositeOperation='multiply'; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=st.color; ctx.lineWidth=st.size; ctx.stroke(p); ctx.restore(); }
  else { ctx.fillStyle=st.color; ctx.fill(p); }
}
/* reconnaissance de formes */
export function rdp(P, eps){
  if(P.length<3) return P.slice();
  let dmax=0, idx=0; const [a,b]=[P[0],P[P.length-1]];
  for(let i=1;i<P.length-1;i++){ const d=segDist(P[i],a,b); if(d>dmax){ dmax=d; idx=i; } }
  if(dmax>eps){ const l=rdp(P.slice(0,idx+1),eps), r=rdp(P.slice(idx),eps); return l.slice(0,-1).concat(r); }
  return [a,b];
}
export function segDist(p,a,b){ const dx=b[0]-a[0], dy=b[1]-a[1]; const l=dx*dx+dy*dy; let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(a[0]+t*dx-p[0], a[1]+t*dy-p[1]); }
export function recognizeShape(a){
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
export function shapeToPts(sh, p){
  const out=[]; const push=(x,y)=>out.push(Math.round(x*10)/10,Math.round(y*10)/10,p);
  const seg=(a,b)=>{ const L=Math.hypot(b[0]-a[0],b[1]-a[1]); const k=Math.max(1,Math.ceil(L/6)); for(let i=0;i<k;i++) push(a[0]+(b[0]-a[0])*i/k, a[1]+(b[1]-a[1])*i/k); };
  if(sh.type==='line'){ seg(sh.pts[0],sh.pts[1]); push(sh.pts[1][0],sh.pts[1][1]); }
  else if(sh.type==='poly'){ const q=sh.pts; for(let i=0;i<q.length;i++) seg(q[i],q[(i+1)%q.length]); push(q[0][0],q[0][1]); }
  else if(sh.type==='ellipse'){ const k=Math.max(24,Math.ceil(Math.PI*(sh.rx+sh.ry)/6)); for(let i=0;i<=k;i++){ const t=i/k*Math.PI*2; push(sh.cx+Math.cos(t)*sh.rx, sh.cy+Math.sin(t)*sh.ry); } }
  return out;
}
/* gomme précise : coupe le trait */
export function splitStroke(st, wx, wy, r){
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
export function hitStroke(st, wx, wy, r){
  const b=strokeBox(st); if(wx<b[0]-r||wx>b[2]+r||wy<b[1]-r||wy>b[3]+r) return false;
  const a=st.pts, R=r+st.size/2;
  if(a.length===3) return Math.hypot(a[0]-wx,a[1]-wy)<=R;
  for(let i=3;i<a.length;i+=3) if(segDist([wx,wy],[a[i-3],a[i-2]],[a[i],a[i+1]])<=R) return true;
  return false;
}
export function pointInPoly(x,y,poly){ let ins=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1]; if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins; } return ins; }

