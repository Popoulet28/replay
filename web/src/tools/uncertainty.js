import { el } from '../core/helpers.js';
import { S } from '../core/state.js';
import { evalNum, idsIn, parseExpr } from './expr.js';
import { fmtVU, parseNum } from './numfmt.js';
import { toast } from '../ui/chrome.js';

/* ---- rounding with uncertainty ---- */
export async function copyText(t, okMsg){ try{ await navigator.clipboard.writeText(t); toast(okMsg||'Copié'); }catch(e){ toast('Copie impossible ici.','err'); } }

/* ---- 5a. Uncertainty propagation ---- */
export function uncTool(){
  const U=S.unc=S.unc||{formula:'g = 4 pi^2 l / T^2', vars:{l:{v:'0.85',u:'0.002'},T:{v:'1.85',u:'0.01'}}, unit:'m/s²'};
  const root=el('div');
  const fIn=el('input',{type:'text',value:U.formula,placeholder:'ex. g = 4 pi^2 l / T^2',style:{fontSize:'19px'}});
  const unitIn=el('input',{type:'text',value:U.unit||'',placeholder:'unité du résultat (facultatif)'});
  const varsBox=el('div',{class:'uvars'});
  const out=el('div',{class:'result'});
  let ast=null, name='f';
  function parseF(){
    const src=fIn.value.trim(); U.formula=src;
    try{ const r=parseExpr(src);
      if(r.right){ if(r.left.t!=='id') throw {msg:'À gauche du « = », mets juste un nom, ex. g = …'}; name=r.left.n; ast=r.right; } else { name='f'; ast=r.left; }
      return null; }catch(e){ ast=null; return e.msg==='empty'?'':(e.msg||'Erreur'); }
  }
  function drawVars(){
    varsBox.replaceChildren();
    if(!ast) return;
    const ids=[...idsIn(ast)];
    if(!ids.length){ varsBox.append(el('p',{class:'muted small',text:'Aucune variable dans la formule.'})); return; }
    varsBox.append(el('div',{class:'uv-head'}, el('span',{text:'Variable'}), el('span',{text:'Valeur'}), el('span',{text:'± incertitude'})));
    ids.forEach(id=>{
      const cur=U.vars[id]=U.vars[id]||{v:'',u:''};
      const vi=el('input',{type:'text',inputmode:'decimal',value:cur.v,placeholder:'valeur'}), ui=el('input',{type:'text',inputmode:'decimal',value:cur.u,placeholder:'0'});
      vi.addEventListener('input',()=>{ cur.v=vi.value; compute(); }); ui.addEventListener('input',()=>{ cur.u=ui.value; compute(); });
      varsBox.append(el('div',{class:'uv-row'}, el('b',{class:'uv-name',text:id}), vi, ui));
    });
  }
  function compute(){
    U.unit=unitIn.value;
    if(!ast){ return; }
    const ids=[...idsIn(ast)]; const vals={}, us={};
    for(const id of ids){ const v=parseNum((U.vars[id]||{}).v); if(!isFinite(v)){ out.className='result'; out.replaceChildren(el('span',{class:'muted',text:'Entre une valeur pour '+id+'.'})); return; } vals[id]=v; const u=parseNum((U.vars[id]||{}).u); us[id]=isFinite(u)?Math.abs(u):0; }
    let f; try{ f=evalNum(ast,vals); }catch(e){ out.className='result bad'; out.textContent=e.msg||'Erreur de calcul'; return; }
    if(!isFinite(f)){ out.className='result bad'; out.textContent='Le résultat n’est pas un nombre fini (division par zéro ?).'; return; }
    let var2=0; const contrib=[];
    for(const id of ids){
      if(!us[id]){ contrib.push([id,0]); continue; }
      const x=vals[id], h=Math.max(Math.abs(x)*1e-6,1e-12);
      const fp=evalNum(ast,Object.assign({},vals,{[id]:x+h})), fm=evalNum(ast,Object.assign({},vals,{[id]:x-h}));
      const c=((fp-fm)/(2*h))*us[id]; contrib.push([id,c*c]); var2+=c*c;
    }
    const u=Math.sqrt(var2); const r=fmtVU(f,u); const unit=unitIn.value.trim();
    out.className='result ok';
    out.replaceChildren(
      el('div',{class:'res-big',text:name+' = '+r.txt+(unit?' '+unit:'')}),
      el('div',{class:'muted small',text: u&&f? 'Incertitude relative : '+(u/Math.abs(f)*100).toPrecision(2)+' %':'Aucune incertitude donnée.'}),
      var2? el('div',{style:{marginTop:'12px'}}, el('div',{class:'small',style:{fontWeight:700,marginBottom:'4px'},text:'D’où vient l’incertitude'}),
        contrib.filter(c=>c[1]>0).sort((a,b)=>b[1]-a[1]).map(([id,c])=>{ const pct=Math.round(c/var2*100); return el('div',{class:'barrow'}, el('span',{text:id}), el('div',{class:'bar'}, el('i',{style:{width:pct+'%'}})), el('span',{class:'small',text:pct+' %'})); })) : '',
      el('div',{class:'row',style:{marginTop:'12px'}}, el('button',{class:'btn small',type:'button',text:'Copier en LaTeX',onclick:()=>copyText('$'+name+' = '+r.tex+(unit?'\\,\\mathrm{'+unit.replace(/²/g,'^2').replace(/³/g,'^3')+'}':'')+'$','LaTeX copié')}),
        el('button',{class:'btn small ghost',type:'button',text:'Copier le texte',onclick:()=>copyText(name+' = '+r.txt+(unit?' '+unit:''))})));
  }
  fIn.addEventListener('input',()=>{ const err=parseF(); if(err){ out.className='result bad'; out.textContent='Formule illisible : '+err; varsBox.replaceChildren(); return; } drawVars(); compute(); });
  unitIn.addEventListener('input',compute);
  const err=parseF(); drawVars(); if(!err) compute();
  root.append(el('div',{class:'card'}, el('h3',{text:'Propagation des incertitudes'}),
    el('p',{class:'muted small',text:'Écris ta formule, entre tes mesures avec leurs incertitudes : le résultat est arrondi correctement (2 chiffres significatifs sur l’incertitude). Variables indépendantes, propagation quadratique.'}),
    el('label',{class:'f',text:'Formule'}), fIn, el('label',{class:'f',text:'Mesures'}), varsBox,
    el('label',{class:'f',text:'Unité du résultat'}), unitIn, el('div',{style:{marginTop:'16px'}}, out)));
  return root;
}

