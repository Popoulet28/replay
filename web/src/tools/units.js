import { el } from '../core/helpers.js';
import { S } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { DEFAULT_SYMBOLS, dEq, evalDim, fmtDim, parseExpr, show, symbolTable } from './expr.js';

/* ---- 4. Units tool ---- */
export function unitsTool(){
  const st=S.settings;
  const root=el('div');
  const inp=el('textarea',{placeholder:'ex. v^2 = v0^2 + 2 a x', style:{minHeight:'70px',fontSize:'19px'}});
  inp.value=S.unitsExpr||'';
  const out=el('div',{class:'result'});
  const symArea=el('textarea',{style:{minHeight:'240px',fontSize:'14.5px',fontFamily:'ui-monospace,monospace'}});
  symArea.value=st.unitSymbols||DEFAULT_SYMBOLS;
  function run(){
    S.unitsExpr=inp.value;
    const src=inp.value.trim(); out.className='result';
    if(!src){ out.replaceChildren(el('span',{class:'muted',text:'Tape une expression ou une équation. Les produits peuvent s’écrire avec * ou un espace : 2 a x.'})); return; }
    const {tab}=symbolTable(symArea.value);
    let ast; try{ ast=parseExpr(src); }catch(e){ out.className='result bad'; out.textContent=e.msg==='empty'?'':'Je n’arrive pas à lire l’expression : '+e.msg; return; }
    try{
      const L=evalDim(ast.left,tab);
      if(!ast.right){ out.className='result ok'; out.replaceChildren(el('div',{class:'res-big',text:fmtDim(L.d)}), el('div',{class:'muted small',text:'Dimension de « '+show(ast.left)+' »'})); return; }
      const R=evalDim(ast.right,tab);
      if(dEq(L.d,R.d)){ out.className='result ok'; out.replaceChildren(el('div',{class:'res-big',text:'✓ Homogène'}), el('div',{text:'Les deux côtés sont en '+fmtDim(L.d)+'.'})); }
      else { out.className='result bad'; out.replaceChildren(el('div',{class:'res-big',text:'✗ Pas homogène'}), el('div',{text:'À gauche : '+fmtDim(L.d)}), el('div',{text:'À droite : '+fmtDim(R.d)})); }
    }catch(e){
      if(e.unknown){ out.className='result warn'; out.replaceChildren(el('div',{text:'Je ne connais pas « '+e.unknown+' ». Ajoute une ligne « '+e.unknown+' = unité » dans tes symboles ci-dessous.'})); return; }
      if(e.mismatch){ const [a,da,b,db]=e.mismatch; out.className='result bad'; out.replaceChildren(el('div',{class:'res-big',text:'✗ Addition impossible'}), el('div',{text:'Tu additionnes « '+show(a)+' » ('+fmtDim(da)+') et « '+show(b)+' » ('+fmtDim(db)+').'})); return; }
      out.className='result bad'; out.textContent=e.msg||'Erreur';
    }
  }
  inp.addEventListener('input',run);
  symArea.addEventListener('input',run);
  symArea.addEventListener('change',()=>{ st.unitSymbols=symArea.value; saveSettings(); });
  const ex=['F = m a','E = 1/2 m v^2 + m g h','v^2 = v0^2 + 2 a x','T = 2 pi sqrt(l/g)','x = v t + a t'].map(e=>el('button',{type:'button',class:'chip',text:e,onclick:()=>{ inp.value=e; run(); }}));
  root.append(el('div',{class:'card'},
    el('h3',{text:'Vérificateur d’unités'}),
    el('p',{class:'muted small',text:'Vérifie qu’une formule est homogène avant de te lancer dans les calculs.'}),
    inp, out, el('div',{class:'chips',style:{marginTop:'12px'}}, el('span',{class:'muted small',text:'Exemples :'}), ex)),
    el('details',{class:'card'}, el('summary',{text:'Mes symboles'}), el('p',{class:'muted small',text:'Une ligne par symbole : nom = unité SI (kg, m, s, K, A, mol, N, J, W, Pa, Hz, C, V, rad…). « 1 » veut dire sans dimension.'}), symArea,
      el('div',{class:'row',style:{marginTop:'10px'}}, el('button',{class:'btn small ghost',type:'button',text:'Remettre les symboles par défaut',onclick:()=>{ symArea.value=DEFAULT_SYMBOLS; st.unitSymbols=DEFAULT_SYMBOLS; saveSettings(); run(); }}))));
  run();
  return root;
}

