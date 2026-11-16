/* ================= expression parser (units + uncertainties) ================= */
export const FUNCS=['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','exp','ln','log','sqrt','abs','arcsin','arccos','arctan'];
export const CONSTS={pi:Math.PI,'π':Math.PI};
export function tokenize(src){
  const s=src.replace(/\*\*/g,'^').replace(/[×·⋅]/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/√/g,'sqrt');
  const toks=[]; let i=0;
  const idRe=/^[A-Za-zΑ-Ωα-ωµΩ_][A-Za-z0-9Α-Ωα-ωµΩ_']*/;
  const numRe=/^(\d+[.,]?\d*|[.,]\d+)([eE][+-]?\d+)?/;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){ i++; continue; }
    let m;
    if((m=numRe.exec(s.slice(i)))){ toks.push({t:'num',v:parseFloat(m[0].replace(',','.')),s:m[0]}); i+=m[0].length; continue; }
    if((m=idRe.exec(s.slice(i)))){ toks.push({t:'id',v:m[0]}); i+=m[0].length; continue; }
    if('+-*/^()='.includes(c)){ toks.push({t:c}); i++; continue; }
    throw {msg:'Caractère inattendu : « '+c+' »'};
  }
  return toks;
}
export function parseExpr(src){
  const toks=tokenize(src); let k=0;
  const peek=()=>toks[k], next=()=>toks[k++];
  const expect=t=>{ const x=next(); if(!x||x.t!==t) throw {msg:'« '+t+' » attendu'}; };
  function expr(){ let a=term(); while(peek()&&(peek().t==='+'||peek().t==='-')){ const op=next().t; a={t:'bin',op,a,b:term()}; } return a; }
  function term(){ let a=unary();
    for(;;){ const p=peek(); if(!p) break;
      if(p.t==='*'||p.t==='/'){ next(); a={t:'bin',op:p.t,a,b:unary()}; }
      else if(p.t==='num'||p.t==='id'||p.t==='('){ a={t:'bin',op:'*',a,b:power(),imp:true}; }
      else break; }
    return a; }
  function unary(){ const p=peek(); if(p&&(p.t==='-'||p.t==='+')){ next(); const a=unary(); return p.t==='-'?{t:'neg',a}:a; } return power(); }
  function power(){ const a=atom(); if(peek()&&peek().t==='^'){ next(); return {t:'pow',a,b:unary()}; } return a; }
  function atom(){ const p=next(); if(!p) throw {msg:'Expression incomplète'};
    if(p.t==='num') return {t:'num',v:p.v};
    if(p.t==='id'){ if(FUNCS.includes(p.v) && peek()&&peek().t==='('){ next(); const a=expr(); expect(')'); return {t:'call',f:p.v,a}; } return {t:'id',n:p.v}; }
    if(p.t==='('){ const a=expr(); expect(')'); return {t:'par',a}; }
    throw {msg:'« '+p.t+' » inattendu'}; }
  const left=expr(); let right=null;
  if(peek()&&peek().t==='='){ next(); right=expr(); }
  if(k<toks.length) throw {msg:'« '+(peek().v||peek().t)+' » inattendu'};
  if(!toks.length) throw {msg:'empty'};
  return {left,right};
}
export function show(n){
  switch(n.t){
    case 'num': return String(n.v);
    case 'id': return n.n;
    case 'par': return '('+show(n.a)+')';
    case 'neg': return '-'+show(n.a);
    case 'call': return n.f+'('+show(n.a)+')';
    case 'pow': return show(n.a)+'^'+show(n.b);
    case 'bin': return n.op==='*'&&n.imp ? show(n.a)+' '+show(n.b) : n.op==='*'||n.op==='/' ? show(n.a)+n.op+show(n.b) : show(n.a)+' '+n.op+' '+show(n.b);
  }
  return '?';
}
export function idsIn(n, set){ set=set||new Set(); if(!n) return set;
  if(n.t==='id' && !(n.n in CONSTS)) set.add(n.n);
  ['a','b'].forEach(k=>n[k]&&idsIn(n[k],set)); return set; }

/* ---- numbers ---- */
export function evalNum(n, vars){
  switch(n.t){
    case 'num': return n.v;
    case 'id': if(n.n in vars) return vars[n.n]; if(n.n in CONSTS) return CONSTS[n.n]; throw {msg:'Valeur manquante pour '+n.n};
    case 'par': return evalNum(n.a,vars);
    case 'neg': return -evalNum(n.a,vars);
    case 'pow': return Math.pow(evalNum(n.a,vars), evalNum(n.b,vars));
    case 'bin': { const a=evalNum(n.a,vars), b=evalNum(n.b,vars); return n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:a/b; }
    case 'call': { const x=evalNum(n.a,vars); const F={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,arcsin:Math.asin,arccos:Math.acos,arctan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,exp:Math.exp,ln:Math.log,log:Math.log10,sqrt:Math.sqrt,abs:Math.abs}; return F[n.f](x); }
  }
}

/* ---- dimensions: [kg, m, s, K, A, mol] ---- */
export const D0=[0,0,0,0,0,0];
export const dAdd=(a,b)=>a.map((x,i)=>x+b[i]), dSub=(a,b)=>a.map((x,i)=>x-b[i]), dMul=(a,k)=>a.map(x=>x*k);
export const dEq=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-9), dZero=a=>dEq(a,D0);
export const UNIT_TABLE=(()=>{ const U={}; const set=(names,d)=>names.split(' ').forEach(n=>U[n]=d);
  set('kg g mg t',[1,0,0,0,0,0]); set('m cm mm km µm nm',[0,1,0,0,0,0]); set('s ms min h',[0,0,1,0,0,0]); set('K',[0,0,0,1,0,0]); set('A',[0,0,0,0,1,0]); set('mol',[0,0,0,0,0,1]);
  set('N',[1,1,-2,0,0,0]); set('J eV cal',[1,2,-2,0,0,0]); set('W',[1,2,-3,0,0,0]); set('Pa bar atm',[1,-1,-2,0,0,0]); set('Hz',[0,0,-1,0,0,0]);
  set('C',[0,0,1,0,1,0]); set('V',[1,2,-3,0,-1,0]); set('Ω ohm',[1,2,-3,0,-2,0]); set('T',[1,0,-2,0,-1,0]); set('L',[0,3,0,0,0,0]); set('rad sr',D0);
  return U; })();
export function evalDim(n, table){
  switch(n.t){
    case 'num': return {d:D0, c:n.v};
    case 'id': { if(n.n in CONSTS) return {d:D0,c:CONSTS[n.n]}; if(n.n in table) return {d:table[n.n],c:null};
      const parts=splitId(n.n,table); if(parts){ return {d:parts.reduce((acc,p)=>dAdd(acc, p in CONSTS?D0:table[p]), D0), c:null}; }
      throw {unknown:n.n}; }
    case 'par': return evalDim(n.a,table);
    case 'neg': { const r=evalDim(n.a,table); return {d:r.d,c:r.c==null?null:-r.c}; }
    case 'pow': { const a=evalDim(n.a,table), b=evalDim(n.b,table);
      if(!dZero(b.d)) throw {msg:'L’exposant « '+show(n.b)+' » doit être sans dimension.'};
      if(b.c==null){ if(dZero(a.d)) return {d:D0,c:null}; throw {msg:'L’exposant « '+show(n.b)+' » doit être un nombre.'}; }
      return {d:dMul(a.d,b.c), c:a.c==null?null:Math.pow(a.c,b.c)}; }
    case 'bin': { const a=evalDim(n.a,table), b=evalDim(n.b,table);
      if(n.op==='+'||n.op==='-'){ if(!dEq(a.d,b.d)) throw {mismatch:[n.a,a.d,n.b,b.d]}; return {d:a.d,c:(a.c!=null&&b.c!=null)?(n.op==='+'?a.c+b.c:a.c-b.c):null}; }
      if(n.op==='*') return {d:dAdd(a.d,b.d),c:(a.c!=null&&b.c!=null)?a.c*b.c:null};
      return {d:dSub(a.d,b.d),c:(a.c!=null&&b.c!=null)?a.c/b.c:null}; }
    case 'call': { const a=evalDim(n.a,table);
      if(n.f==='sqrt') return {d:dMul(a.d,.5),c:null};
      if(n.f==='abs') return {d:a.d,c:null};
      if(!dZero(a.d)) throw {msg:'L’argument de '+n.f+'( ) doit être sans dimension, or « '+show(n.a)+' » est en '+fmtDim(a.d)+'.'};
      return {d:D0,c:null}; }
  }
}
/* "mgh" -> m·g·h when every piece is a known symbol (longest match first) */
export function splitId(name, table){
  const memo={};
  function go(i){ if(i===name.length) return []; if(i in memo) return memo[i];
    for(let j=name.length;j>i;j--){ const piece=name.slice(i,j); if(piece in table || piece in CONSTS){ const rest=go(j); if(rest){ return memo[i]=[piece].concat(rest); } } }
    return memo[i]=null; }
  const r=go(0); return r && r.length>1 ? r : null;
}
export const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','.':'·','/':'ᐟ'};
export function supNum(x){ const r=Math.round(x*100)/100; let s=Number.isInteger(r)?String(r):(Math.abs(r*2-Math.round(r*2))<1e-9?(Math.round(r*2)+'/2'):String(r)); return s.split('').map(ch=>SUP[ch]||ch).join(''); }
export const NAMED=[['N',[1,1,-2,0,0,0]],['J',[1,2,-2,0,0,0]],['W',[1,2,-3,0,0,0]],['Pa',[1,-1,-2,0,0,0]],['C',[0,0,1,0,1,0]],['V',[1,2,-3,0,-1,0]]];
export function fmtDim(d){
  if(dZero(d)) return 'sans dimension';
  const names=['kg','m','s','K','A','mol'];
  const parts=d.map((x,i)=>Math.abs(x)<1e-9?null:names[i]+(Math.abs(x-1)<1e-9?'':supNum(x))).filter(Boolean);
  const nm=NAMED.find(([,v])=>dEq(v,d));
  return parts.join('·')+(nm?' (= '+nm[0]+')':'');
}
export const DEFAULT_SYMBOLS=`# symbole = unité SI (modifie ou ajoute les tiens)
m = kg
M = kg
g = m/s^2
a = m/s^2
v = m/s
v0 = m/s
u = m/s
c = m/s
x = m
y = m
h = m
d = m
l = m
r = m
R = m
t = s
T = s
F = N
N = N
P = W
E = J
W = J
Q = J
U = J
k = N/m
G = N m^2/kg^2
p = kg m/s
I = kg m^2
tau = N m
omega = rad/s
ω = rad/s
mu = 1
μ = 1
theta = 1
θ = 1
alpha = 1
rho = kg/m^3
ρ = kg/m^3
V = m^3
n = mol
C = J/K
`;
export function symbolTable(text){
  const tab={}, errs=[];
  text.split('\n').forEach((line,i)=>{
    const l=line.replace(/#.*/,'').trim(); if(!l) return;
    const m=/^([^=]+)=(.+)$/.exec(l); if(!m){ errs.push('ligne '+(i+1)); return; }
    const name=m[1].trim(); const spec=m[2].trim();
    try{ const ast=parseExpr(spec); const r=evalDim(ast.left, UNIT_TABLE); tab[name]=r.d; }catch(e){ errs.push(name); }
  });
  return {tab, errs};
}

