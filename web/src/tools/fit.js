import { el } from '../core/helpers.js';
import { S } from '../core/state.js';
import { fmtVU, parseNum } from './numfmt.js';
import { copyText } from './uncertainty.js';

/* ---- 5b. Linear fit ---- */
export function niceTicks(lo,hi,n){ if(lo===hi){ lo-=1; hi+=1; } const span=hi-lo; const step0=span/n; const mag=Math.pow(10,Math.floor(Math.log10(step0))); const step=[1,2,5,10].map(m=>m*mag).find(s=>s>=step0); const t=[]; for(let v=Math.ceil(lo/step)*step; v<=hi+1e-9*span; v+=step) t.push(+v.toPrecision(12)); return {ticks:t, step}; }
export function fitTool(){
  const F=S.fit=S.fit||{data:'# exemple : pendule, L [m]  T² [s²]  σ(T²)\n0.20 0.82 0.03\n0.30 1.19 0.03\n0.40 1.63 0.04\n0.50 2.01 0.04\n0.60 2.43 0.05\n0.70 2.80 0.05', xl:'L [m]', yl:'T² [s²]'};
  const root=el('div');
  const ta=el('textarea',{style:{minHeight:'170px',fontFamily:'ui-monospace,monospace',fontSize:'15px'}}); ta.value=F.data;
  const xl=el('input',{type:'text',value:F.xl,placeholder:'nom de x (ex. L [m])'}), yl=el('input',{type:'text',value:F.yl,placeholder:'nom de y (ex. T² [s²])'});
  const out=el('div',{class:'result'}); const plot=el('div',{class:'plot'});
  function run(){
    F.data=ta.value; F.xl=xl.value; F.yl=yl.value;
    const rows=[]; let bad=0;
    ta.value.split('\n').forEach(line=>{ const l=line.trim(); if(!l||l.startsWith('#')) return; const parts=l.split(/[\s;\t]+/).map(parseNum); if(parts.length<2||parts.slice(0,3).some(x=>!isFinite(x))){ bad++; return; } rows.push(parts); });
    plot.replaceChildren();
    if(rows.length<3){ out.className='result'; out.replaceChildren(el('span',{class:'muted',text:'Il faut au moins 3 points (une ligne par point : x y [σy]).'})); return; }
    const weighted=rows.every(r=>r.length>=3 && r[2]>0);
    const xs=rows.map(r=>r[0]), ys=rows.map(r=>r[1]), sg=rows.map(r=>weighted?r[2]:1);
    let S0=0,Sx=0,Sy=0,Sxx=0,Sxy=0;
    rows.forEach((r,i)=>{ const w=1/(sg[i]*sg[i]); S0+=w; Sx+=w*xs[i]; Sy+=w*ys[i]; Sxx+=w*xs[i]*xs[i]; Sxy+=w*xs[i]*ys[i]; });
    const D=S0*Sxx-Sx*Sx; if(Math.abs(D)<1e-300){ out.className='result bad'; out.textContent='Tous les x sont identiques : ajustement impossible.'; return; }
    const a=(S0*Sxy-Sx*Sy)/D, b=(Sxx*Sy-Sx*Sxy)/D; const n=rows.length, ndf=n-2;
    let chi2=0, ssr=0; rows.forEach((r,i)=>{ const res=ys[i]-(a*xs[i]+b); chi2+=res*res/(sg[i]*sg[i]); ssr+=res*res; });
    let sa, sb;
    if(weighted){ sa=Math.sqrt(S0/D); sb=Math.sqrt(Sxx/D); } else { const s2=ssr/Math.max(1,ndf); sa=Math.sqrt(s2*S0/D); sb=Math.sqrt(s2*Sxx/D); }
    const ym=ys.reduce((p,c)=>p+c,0)/n; const sst=ys.reduce((p,c)=>p+(c-ym)*(c-ym),0); const R2=sst?1-ssr/sst:1;
    const A=fmtVU(a,sa), B=fmtVU(b,sb);
    out.className='result ok';
    out.replaceChildren(
      el('div',{class:'res-big',text:'y = a x + b'}),
      el('div',{text:'pente a = '+A.txt}), el('div',{text:'ordonnée b = '+B.txt}),
      el('div',{class:'muted small',style:{marginTop:'6px'},text: weighted ? 'χ² = '+chi2.toPrecision(3)+' pour '+ndf+' degrés de liberté (χ²/ndl = '+(chi2/Math.max(1,ndf)).toPrecision(3)+(chi2/Math.max(1,ndf)>3?' : bien plus que 1, tes incertitudes sont peut-être sous-estimées ou le modèle n’est pas linéaire':chi2/Math.max(1,ndf)<0.3?' : bien moins que 1, tes incertitudes sont peut-être surestimées':' : cohérent')+')' : 'Sans incertitudes σy : les erreurs sur a et b sont estimées à partir de la dispersion. R² = '+R2.toFixed(4)}),
      bad? el('div',{class:'muted small',text:bad+' ligne(s) ignorée(s) car illisible(s).'}):'',
      el('div',{class:'row',style:{marginTop:'12px'}},
        el('button',{class:'btn small',type:'button',text:'Copier les résultats (LaTeX)',onclick:()=>copyText('$a = '+A.tex+'$, $b = '+B.tex+'$'+(weighted?', $\\chi^2/\\mathrm{ndl} = '+(chi2/Math.max(1,ndf)).toPrecision(3)+'$':''),'LaTeX copié')}),
        el('button',{class:'btn small ghost',type:'button',text:'Copier le tableau (LaTeX)',onclick:()=>copyText(latexTable(rows,weighted,xl.value,yl.value),'Tableau LaTeX copié')})));
    plot.append(drawPlot(xs,ys,weighted?sg:null,a,b,xl.value||'x',yl.value||'y'));
  }
  [ta,xl,yl].forEach(x=>x.addEventListener('input',run));
  root.append(el('div',{class:'card'}, el('h3',{text:'Ajustement linéaire (TP)'}),
    el('p',{class:'muted small',text:'Colle tes mesures : une ligne par point, colonnes x, y et (facultatif) σy, séparées par des espaces, des tabulations ou des points-virgules. Tu peux copier directement depuis un tableur.'}),
    ta, el('div',{class:'grid2',style:{marginTop:'10px'}}, xl, yl), el('div',{style:{marginTop:'14px'}}, out), plot));
  run();
  return root;
}
export function latexTable(rows,weighted,xl,yl){
  const h=weighted?'$'+(xl||'x')+'$ & $'+(yl||'y')+'$ & $\\sigma_y$':'$'+(xl||'x')+'$ & $'+(yl||'y')+'$';
  return '\\begin{tabular}{'+(weighted?'ccc':'cc')+'}\n\\hline\n'+h+' \\\\\n\\hline\n'+rows.map(r=>(weighted?[r[0],r[1],r[2]]:[r[0],r[1]]).join(' & ')+' \\\\').join('\n')+'\n\\hline\n\\end{tabular}';
}
export function drawPlot(xs,ys,sg,a,b,xl,yl){
  const W=640,H=380,ml=64,mr=18,mt=16,mb=52; const NS='http://www.w3.org/2000/svg';
  const x0=Math.min(...xs), x1=Math.max(...xs); const lo=ys.map((y,i)=>y-(sg?sg[i]:0)), hi=ys.map((y,i)=>y+(sg?sg[i]:0));
  const fy=[a*x0+b,a*x1+b]; let y0=Math.min(...lo,...fy), y1=Math.max(...hi,...fy);
  const px=(x1-x0)*0.06||1, py=(y1-y0)*0.08||1; const X0=x0-px, X1=x1+px, Y0=y0-py, Y1=y1+py;
  const sx=x=>ml+(x-X0)/(X1-X0)*(W-ml-mr), sy=y=>H-mb-(y-Y0)/(Y1-Y0)*(H-mt-mb);
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.setAttribute('role','img'); svg.setAttribute('aria-label','Graphique de l’ajustement linéaire');
  const mk=(t,attrs,txt)=>{ const n=document.createElementNS(NS,t); for(const k in attrs) n.setAttribute(k,attrs[k]); if(txt!=null) n.textContent=txt; svg.append(n); return n; };
  const fmtT=v=>Math.abs(v)<1e-12?'0':(Math.abs(v)>=1e4||Math.abs(v)<1e-3?v.toExponential(1):String(+v.toPrecision(4)));
  niceTicks(X0,X1,6).ticks.forEach(t=>{ mk('line',{x1:sx(t),x2:sx(t),y1:mt,y2:H-mb,class:'p-grid'}); mk('text',{x:sx(t),y:H-mb+18,'text-anchor':'middle',class:'p-tick'},fmtT(t)); });
  niceTicks(Y0,Y1,6).ticks.forEach(t=>{ mk('line',{x1:ml,x2:W-mr,y1:sy(t),y2:sy(t),class:'p-grid'}); mk('text',{x:ml-8,y:sy(t)+4,'text-anchor':'end',class:'p-tick'},fmtT(t)); });
  mk('line',{x1:ml,x2:W-mr,y1:H-mb,y2:H-mb,class:'p-axis'}); mk('line',{x1:ml,x2:ml,y1:mt,y2:H-mb,class:'p-axis'});
  mk('text',{x:(ml+W-mr)/2,y:H-10,'text-anchor':'middle',class:'p-label'},xl);
  mk('text',{x:16,y:(mt+H-mb)/2,'text-anchor':'middle',transform:'rotate(-90 16 '+((mt+H-mb)/2)+')',class:'p-label'},yl);
  mk('line',{x1:sx(X0),y1:sy(a*X0+b),x2:sx(X1),y2:sy(a*X1+b),class:'p-fit'});
  xs.forEach((x,i)=>{ if(sg){ mk('line',{x1:sx(x),x2:sx(x),y1:sy(ys[i]-sg[i]),y2:sy(ys[i]+sg[i]),class:'p-err'}); [ys[i]-sg[i],ys[i]+sg[i]].forEach(e=>mk('line',{x1:sx(x)-5,x2:sx(x)+5,y1:sy(e),y2:sy(e),class:'p-err'})); } mk('circle',{cx:sx(x),cy:sy(ys[i]),r:4.5,class:'p-pt'}); });
  return svg;
}

