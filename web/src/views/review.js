import { hintBox, verifyBox } from '../ai/claude.js';
import { REASON_LABEL } from '../core/data.js';
import { clone, el, fmtDate, fmtInterval, today } from '../core/helpers.js';
import { imgEl, imgSrc } from '../core/images.js';
import { S, courseTag, topicsOf } from '../core/state.js';
import { saveProblem, saveSettings } from '../core/storage.js';
import { reviewXP, xpToast } from '../game/game.js';
import { backlog, schedule } from '../srs/schedule.js';
import { go, render, viewImage } from '../ui/chrome.js';
import { InkPad } from '../ui/components.js';
import { mathText } from '../ui/math.js';
import { viewToday } from './today.js';

/* ---------- Review session ---------- */
export function startSession(ids, label){ if(!ids.length) return; S.session={ids, i:0, revealed:false, label, results:[]}; S.view='review'; render(); window.scrollTo(0,0); }
export function viewReview(){
  const s=S.session; const root=el('div');
  if (!s){ return viewToday(); }
  if (s.i>=s.ids.length){
    const counts={again:0,hard:0,good:0,easy:0}; s.results.forEach(r=>counts[r]++);
    const more = backlog();
    root.append(el('div',{class:'card empty'},
      el('div',{class:'done-stamp',style:{margin:'0 auto 14px'}}, el('span',{text:'Fait !'})), el('h2',{text:'Session terminée'}),
      el('p',{class:'muted',text: s.results.length+' refait'+(s.results.length===1?'':'s')+' · '+counts.good+' bien, '+counts.easy+' facile, '+counts.hard+' difficile, '+counts.again+' à revoir'}),
      counts.again ? el('p',{class:'small',text:'Ceux marqués “à revoir” reviennent demain.'}) : null,
      el('div',{class:'row',style:{justifyContent:'center'}},
        el('button',{class:'btn primary',text:'Retour',onclick:()=>go('today')}),
        more.length ? el('button',{class:'btn',text:'Encore un',onclick:()=>startSession([more[0].id],'Bonus')}) : null)));
    return root;
  }
  const p=S.problems.get(s.ids[s.i]);
  if (!p){ s.i++; return viewReview(); }
  const quick = S.settings.reviewMode==='quick';
  root.append(el('div',{class:'row'}, el('button',{class:'btn small ghost',text:'← Arrêter',onclick:()=>go('today')}), el('span',{class:'spacer'}),
    el('span',{class:'muted small',text:(s.i+1)+' sur '+s.ids.length}), modeToggleSmall()));
  root.append(el('div',{class:'progress'}, el('i',{style:{width:((s.i)/s.ids.length*100)+'%'}})));
  const card=el('div',{class:'card'});
  card.append(el('div',{class:'row',style:{marginBottom:'10px'}},
    courseTag(p.course), topicsOf(p).map(t=>el('span',{class:'tag grey',text:t})), p.source?el('span',{class:'tag grey',text:p.source}):null,
    el('span',{class:'spacer'}), el('span',{class:'muted small',text:'ajouté le '+fmtDate(p.created)})));
  if (p.problemImg) card.append(imgEl({class:'problem-img',ref:p.problemImg,alt:'Énoncé',onclick:()=>viewImage(imgSrc(p.problemImg))}));
  if (p.problemText) card.append(mathText(p.problemText));
  if (!p.problemImg && !p.problemText) card.append(el('p',{class:'muted',text:'(Pas d’énoncé enregistré — regarde ta série : '+(p.source||'inconnue')+')'}));
  card.append(el('div',{class:'instr'}, quick
    ? el('span',{}, el('b',{text:'Mode rapide : '}), 'écris seulement la mise en place et la première étape — le schéma, le système, la loi ou la méthode à utiliser. Environ 2 minutes.')
    : el('span',{}, el('b',{text:'Mode complet : '}), 'résous tout, puis compare.')));
  // scratch pad
  const scratchHolder=el('div');
  const scratchBtn=el('button',{class:'btn small',text:'✎ Brouillon',onclick:()=>{ const pad=InkPad({height:quick?320:520, hint:'Fais tes calculs ici (non enregistré)…'}); scratchHolder.replaceChildren(pad.el, verifyBox(p,pad)||''); scratchBtn.remove(); }});
  card.append(el('div',{class:'row'}, scratchBtn), scratchHolder);
  if (!s.revealed){ const hb=hintBox(p,s); if(hb) card.append(hb); }
  root.append(card);

  if (!s.revealed){
    root.append(el('div',{class:'row',style:{justifyContent:'center'}}, el('button',{class:'btn primary big',text:'Voir la solution',onclick:()=>{ s.revealed=true; render(); }})));
  } else {
    const sol=el('div',{class:'card'}, el('h3',{text:'Solution'}));
    if (p.solutionImg) sol.append(imgEl({class:'problem-img',ref:p.solutionImg,alt:'Solution',onclick:()=>viewImage(imgSrc(p.solutionImg))}));
    if (p.solutionText) sol.append(mathText(p.solutionText));
    if (!p.solutionImg && !p.solutionText) sol.append(el('p',{class:'muted',text:'Pas de solution enregistrée — compare avec ton corrigé.'}));
    if ((p.reasons||[]).length || p.noteImg || p.noteText){
      sol.append(el('hr',{class:'sep'}), el('h3',{text:'La dernière fois, tu l’as raté parce que…'}));
      if ((p.reasons||[]).length) sol.append(el('div',{class:'row'}, p.reasons.map(r=>el('span',{class:'tag',text:REASON_LABEL[r]||r}))));
      if (p.noteImg) sol.append(imgEl({class:'problem-img',style:{marginTop:'10px',maxHeight:'260px'},ref:p.noteImg,alt:'Ta note',onclick:()=>viewImage(imgSrc(p.noteImg))}));
      if (p.noteText) sol.append(mathText(p.noteText));
    }
    root.append(sol);
    root.append(el('div',{class:'card'}, el('h3',{text:'Comment ça s’est passé ?'}),
      el('div',{class:'rate'}, ...[['again','À revoir'],['hard','Difficile'],['good','Bien'],['easy','Facile']].map(([r,l])=>{
        const nx=schedule(p,r);
        return el('button',{class:r,onclick:()=>rate(p,r)}, el('i',{class:'click'}), el('span',{text:l}), el('small',{class:'hand',text:fmtInterval(nx.interval)}));
      }))));
  }
  return root;
}
export function modeToggleSmall(){
  return el('button',{class:'btn small ghost',text: S.settings.reviewMode==='quick'?'Rapide ⇄':'Complet ⇄', onclick:()=>{ S.settings.reviewMode = S.settings.reviewMode==='quick'?'full':'quick'; saveSettings(); render(); }});
}
export async function rate(p, r){
  const s=S.session; const np=clone(p);
  np.srs = schedule(p, r);
  const h={d:today(), r, m:S.settings.reviewMode}; if(s.label!=='Aujourd’hui') h.x=1; // révision en plus de la file du jour
  np.history = (np.history||[]).concat([h]);
  s.results.push(r); s.i++; s.revealed=false; xpToast(reviewXP({r, m:S.settings.reviewMode}), p.course);
  render(); window.scrollTo(0,0);
  await saveProblem(np);
}

