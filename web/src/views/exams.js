import { sheetButton } from '../ai/claude.js';
import { addDays, diffDays, el, fmtDate, today, uid } from '../core/helpers.js';
import { S, activeProblems, courseOpts, courses, topicsFor } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { examMatches } from '../srs/schedule.js';
import { confirmBox, render, toast } from '../ui/chrome.js';
import { Chips } from '../ui/components.js';
import { startSession } from './review.js';

/* ---------- Contrôles ---------- */
export function viewExams(){
  const root=el('div'); root.append(el('h2',{text:'Contrôles & examens'}));
  root.append(el('p',{class:'muted small',text:'Dans les '+(S.settings.boostDays||7)+' jours avant un contrôle, ta limite passe à '+(S.settings.examLimit||3)+' par jour et ses thèmes passent en premier. Chaque problème concerné revient au moins une fois dans les deux dernières semaines.'}));
  const t=today();
  const exams=(S.settings.exams||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
  for (const ex of exams){
    const past=ex.date<t; const ps=activeProblems().filter(p=>examMatches(ex,p));
    const start=addDays(ex.date,-14);
    const covered=ps.filter(p=>p.srs.last && p.srs.last>=start).length;
    const card=el('div',{class:'card',style:past?{opacity:.6}:{}},
      el('div',{class:'row'}, el('h3',{text:ex.name,style:{marginBottom:0}}), el('span',{class:'spacer'}), el('span',{class:'tag'+(past?' grey':''),text: past?'passé':(diffDays(t,ex.date)===0?'aujourd’hui':diffDays(t,ex.date)+' jours')})),
      el('div',{class:'muted small',style:{margin:'6px 0 10px'},text:ex.course+' · '+fmtDate(ex.date)+' · '+(ex.topics&&ex.topics.length?ex.topics.join(', '):'tous les thèmes')}),
      !past ? el('div',{class:'small',text: ps.length+' problème'+(ps.length===1?'':'s')+' concerné'+(ps.length===1?'':'s')+' · '+covered+' refait'+(covered===1?'':'s')+' ces 2 dernières semaines'}) : null,
      el('div',{class:'row',style:{marginTop:'12px'}},
        (!past && ps.length) ? el('button',{class:'btn primary',text:'★ Série finale : les '+Math.min(8,ps.length)+' plus durs',onclick:()=>{
          const hard=ps.slice().sort((a,b)=>score(b)-score(a)).slice(0,8); startSession(hard.map(p=>p.id),'Série finale'); }}) : null,
        !past ? sheetButton(ex) : null,
        el('button',{class:'btn ghost danger small',text:'Retirer',onclick:async()=>{ if(await confirmBox('Retirer “'+ex.name+'” ?','Retirer')){ S.settings.exams=S.settings.exams.filter(e=>e.id!==ex.id); await saveSettings(); render(); } }})));
    root.append(card);
  }
  // add form
  const name=el('input',{type:'text',placeholder:'ex. Contrôle 2'}); const date=el('input',{type:'date',min:t});
  let course=courses()[0]; const topicsHolder=el('div'); let tc;
  const drawT=()=>{ tc=Chips(topicsFor(course),[], {multi:true}); topicsHolder.replaceChildren(tc.el); };
  const cc=Chips(courseOpts(), course, {onchange:v=>{ if(!v){cc.set(course);return;} course=v; drawT(); }}); drawT();
  root.append(el('div',{class:'card'}, el('h3',{text:'Ajouter un contrôle'}),
    el('label',{class:'f',text:'Nom'}), name, el('label',{class:'f',text:'Date'}), date,
    el('label',{class:'f',text:'Cours'}), cc.el,
    el('label',{class:'f'},'Thèmes au programme ', el('span',{class:'muted',text:'(aucun choisi = tous)'})), topicsHolder,
    el('div',{class:'row',style:{marginTop:'18px'}}, el('button',{class:'btn primary',text:'Ajouter',onclick:async()=>{
      if(!date.value){ toast('Choisis une date.','err'); return; }
      S.settings.exams=(S.settings.exams||[]).concat([{id:uid(), name:name.value.trim()||'Contrôle', date:date.value, course, topics:tc.get()}]);
      await saveSettings(); toast('Contrôle ajouté'); render(); }}))));
  return root;
}
export function score(p){ const h=p.history||[]; const ag=h.filter(x=>x.r==='again').length, hd=h.filter(x=>x.r==='hard').length; return ag*3+hd+(p.srs.lapses||0)*2 + (h.length?0:1.5); }

