import { REASONS, REASON_LABEL } from '../core/data.js';
import { addDays, clone, el, fmtDate, fmtDue, today } from '../core/helpers.js';
import { imgSrc } from '../core/images.js';
import { S, allProblems, courseTag, courses, shortCourse, topicsFor, topicsOf } from '../core/state.js';
import { removeProblem, saveProblem } from '../core/storage.js';
import { confirmBox, modal, render, toast, viewImage } from '../ui/chrome.js';
import { Chips } from '../ui/components.js';
import { mathText } from '../ui/math.js';
import { startSession } from './review.js';

/* ---------- Library ---------- */
export function viewLibrary(){
  const root=el('div');
  const f=S.libFilter;
  const opts=['all'].concat(courses(),['archived']);
  const seg=el('div',{class:'chips',style:{marginBottom:'14px'}}, opts.map(o=>el('button',{class:'chip'+(f===o?' on':''),text:o==='all'?'Tous':o==='archived'?'Maîtrisés':shortCourse(o),onclick:()=>{S.libFilter=o;render();}})));
  root.append(el('h2',{text:'Carnet'}), seg);
  let list=allProblems().filter(p=> f==='archived' ? p.archived : (!p.archived && (f==='all'||p.course===f)));
  list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  if (!list.length){ root.append(el('div',{class:'card empty muted',text: f==='archived'?'Les problèmes marqués comme maîtrisés apparaissent ici.':'Pas encore de problème ici.'})); return root; }
  const box=el('div',{class:'list'});
  for (const p of list){
    const th = p.problemImg ? el('img',{class:'thumb',src:imgSrc(p.problemImg),alt:'',loading:'lazy'}) : el('div',{class:'thumb txt',text:(p.problemText||'').slice(0,40)});
    box.append(el('div',{class:'item',onclick:()=>openDetail(p.id)}, th,
      el('div',{style:{flex:1,minWidth:0}},
        el('div',{style:{fontWeight:600},text:(topicsOf(p).join(', ')||'Sans thème')+(p.source?' · '+p.source:'')}),
        el('div',{class:'row',style:{marginTop:'4px',gap:'6px'}}, courseTag(p.course), el('span',{class:'muted small',text:(p.reasons||[]).map(r=>REASON_LABEL[r]).join(', ')}))),
      el('div',{class:'small',style:{textAlign:'right'}}, p.archived?el('span',{class:'tag grey',text:'maîtrisé'}):el('span',{class:'tag',text:fmtDue(p.srs.due)}),
        (p.srs.lapses? el('div',{class:'muted small',text:p.srs.lapses+'× à revoir'}) : null))));
  }
  root.append(box); return root;
}
export function openDetail(id){
  const p0=S.problems.get(id); if(!p0) return; const p=clone(p0);
  let close;
  const tChips=Chips(topicsFor(p.course).concat(topicsOf(p).filter(t=>!topicsFor(p.course).includes(t))), topicsOf(p), {multi:true});
  const rc=Chips(REASONS, p.reasons||[], {multi:true});
  const hist=(p.history||[]).slice(-12).map(h=>el('span',{class:'tag grey',text:fmtDate(h.d)+' '+h.r}));
  const box=el('div',{},
    el('div',{class:'row'}, el('h2',{text:topicsOf(p).join(', ')||'Problème',style:{marginBottom:0}}), el('span',{class:'spacer'}), el('button',{class:'btn small ghost',text:'Fermer',onclick:()=>close()})),
    el('div',{class:'muted small',style:{margin:'4px 0 12px'},text:p.course+(p.source?' · '+p.source:'')+' · ajouté le '+fmtDate(p.created)+' · prochain : '+(p.archived?'—':fmtDue(p.srs.due))}),
    p.problemImg? el('img',{class:'problem-img',src:imgSrc(p.problemImg),onclick:()=>viewImage(imgSrc(p.problemImg))}):null,
    p.problemText? mathText(p.problemText):null,
    el('label',{class:'f',text:'Thèmes'}), tChips.el,
    el('label',{class:'f',text:'Pourquoi tu l’as raté'}), rc.el,
    hist.length? el('div',{}, el('label',{class:'f',text:'Dernières révisions'}), el('div',{class:'row'},hist)) : null,
    el('div',{class:'row',style:{marginTop:'20px'}},
      el('button',{class:'btn primary',text:'Enregistrer',onclick:async()=>{ p.topics=tChips.get(); delete p.topic; p.reasons=rc.get(); await saveProblem(p); toast('Mis à jour'); close(); }}),
      el('button',{class:'btn',text:'Refaire maintenant',onclick:()=>{ close(); startSession([p.id],'Seul'); }}),
      el('button',{class:'btn',text:p.archived?'Remettre en révision':'Marquer comme maîtrisé',onclick:async()=>{ p.archived=!p.archived; if(!p.archived) p.srs.due=addDays(today(),1); await saveProblem(p); close(); }}),
      el('span',{class:'spacer'}),
      el('button',{class:'btn danger ghost',text:'Supprimer',onclick:async()=>{ close(); if(await confirmBox('Supprimer définitivement ce problème et ses photos ?','Supprimer')){ await removeProblem(p); toast('Supprimé'); render(); } }})));
  close=modal(box);
}

