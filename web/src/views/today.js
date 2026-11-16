import { diffDays, el, fmtDate, today } from '../core/helpers.js';
import { S, activeProblems, courseTag } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { computeGame, levelStrip, questsCard } from '../game/game.js';
import { backlog, dailyLimit, reviewedToday, streak, todayQueue, upcomingExams } from '../srs/schedule.js';
import { go, render } from '../ui/chrome.js';
import { startSession } from './review.js';
import { tasksSoonCard } from './tasks.js';

/* ---------- Today ---------- */
export const _animSeen=new Set();
export const animOnce=k=>{ if(_animSeen.has(k)) return false; _animSeen.add(k); return true; };
export function viewToday(){
  const root=viewTodayCore(); const g=computeGame();
  const after=root.children[1]||null;
  const t=tasksSoonCard(); if(t) root.insertBefore(t, after);
  root.insertBefore(questsCard(g,true), after);
  root.insertBefore(levelStrip(g), root.firstChild);
  return root; }
export function viewTodayCore(){
  const root=el('div');
  const probs=activeProblems();
  if (!probs.length){
    root.append(el('div',{class:'card'},
      el('h1',{text:'Tes erreurs, en replay.'}),
      el('p',{class:'muted',text:'Après chaque série ou contrôle, ajoute le ou les deux problèmes que tu as ratés. Replay te les remet sous les yeux juste avant que tu oublies comment les résoudre — deux minutes par jour.'}),
      el('ol',{class:'muted'}, el('li',{text:'Prends l’énoncé en photo (et la correction si tu l’as).'}), el('li',{text:'Indique pourquoi tu l’as raté, griffonne une note au stylet.'}), el('li',{text:'Demain, refais juste la mise en place et évalue-toi.'})),
      el('button',{class:'btn primary big',text:'＋ Ajouter ton premier problème',onclick:()=>go('add')})));
    return root;
  }
  const q=todayQueue(), done=reviewedToday(), limit=dailyLimit(), waiting=backlog().length - q.length, st=streak();
  const ex=upcomingExams(S.settings.boostDays||7)[0];
  const card=el('div',{class:'hero'});
  if (q.length){
    const courseSet=[...new Set(q.map(p=>p.course))];
    card.append(el('div',{class:'hero-line'},
      el('span',{class:'hero-num'}, el('span',{class:'hl'+(animOnce('hero-'+q.length)?' swipe':''),text:String(q.length)})),
      el('div',{class:'hero-text'},
        el('h1',{text: q.length===1?'problème à refaire aujourd’hui':'problèmes à refaire aujourd’hui'}),
        el('div',{class:'row',style:{marginTop:'10px'}}, courseSet.map(courseTag)),
        el('p',{class:'hand note',text: (S.settings.reviewMode==='quick'?'mode rapide : juste la mise en place, ~2 min':'mode complet : tout résoudre')}))),
      el('div',{class:'row',style:{marginTop:'22px'}},
        el('button',{class:'btn primary big',text:'Commencer',onclick:()=>startSession(q.map(p=>p.id),'Aujourd’hui')}),
        modeToggle()));
  } else {
    card.append(el('div',{class:'hero-done'},
      el('div',{class:'done-stamp'+(animOnce('stamp-'+(done?'done':'free'))?' anim':'')}, el('span',{text: done?'Fait !':'Libre'})),
      el('h1',{text: done? 'Fini pour aujourd’hui':'Rien à refaire aujourd’hui'}),
      el('p',{class:'muted',text: done ? 'Tu as refait '+done+' problème'+(done===1?'':'s')+' aujourd’hui. À demain !' : 'Un nouveau problème revient le lendemain de son ajout.'}),
      waiting>0 ? el('button',{class:'btn',text:'Encore un ('+waiting+' en attente)',onclick:()=>startSession([backlog()[0].id],'Bonus')}) : null));
  }
  root.append(card);
  const info=el('div',{class:'grid2'});
  info.append(el('div',{class:'card'}, el('h3',{text:'Cette semaine'}),
    el('div',{class:'row'}, el('span',{class:'tag hlt',text: st+' jour'+(st>1?'s':'')+' d’affilée'}), el('span',{class:'tag grey',text:'Limite : '+limit+'/jour'}), done?el('span',{class:'tag grey',text:done+' fait'+(done===1?'':'s')+' aujourd’hui'}):null),
    waiting>0 && q.length ? el('p',{class:'muted small',text:waiting+' autre'+(waiting===1?'':'s')+' en attente — ils arriveront petit à petit.'}) : null));
  info.append(el('div',{class:'card'}, el('h3',{text:'Prochain contrôle'}),
    ex ? el('div',{}, el('div',{text:ex.name+' · '+fmtDate(ex.date)}), el('div',{class:'muted small',text: 'Dans '+diffDays(today(),ex.date)+' jours — mode révision activé ('+limit+'/jour).'}))
       : el('div',{class:'muted small'}, 'Aucun. ', el('a',{href:'#',onclick:e=>{e.preventDefault();go('exams');},text:'Ajoute-en un'}),' pour réviser plus la semaine d’avant.')));
  root.append(info);
  return root;
}
export function modeToggle(){
  const seg=el('div',{class:'seg'});
  for (const [m,l] of [['quick','Rapide'],['full','Complet']])
    seg.append(el('button',{class:S.settings.reviewMode===m?'on':'',text:l,onclick:()=>{ S.settings.reviewMode=m; saveSettings(); render(); }}));
  return seg;
}

