import { addDays, diffDays, el, fmtDate, parseYmd, today, uid } from '../core/helpers.js';
import { S, courseOpts, courseTag, courses } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { taskXP, xpToast } from '../game/game.js';
import { go, render, toast } from '../ui/chrome.js';
import { Chips } from '../ui/components.js';
import { viewExams } from './exams.js';

/* ================= 6. Séries & TP tracker ================= */
export const TASK_TYPES=[['serie','Série'],['tp','TP'],['autre','Autre']];
export function fmtTaskDue(d){ const n=diffDays(today(),d); if(n<0) return 'en retard de '+(-n)+' j'; if(n===0) return 'aujourd’hui'; if(n===1) return 'demain'; if(n<7) return parseYmd(d).toLocaleDateString('fr-CH',{weekday:'long'}); return fmtDate(d); }
export function taskRow(x){
  const late=!x.done && x.due<today();
  const box=el('input',{type:'checkbox',class:'tick',checked:!!x.done,'aria-label':'Fait : '+x.title,onchange:async()=>{ x.done=box.checked; x.doneAt=x.done?today():null; await saveSettings(); render(); if(x.done) xpToast(taskXP(x), x.doneAt<=x.due?'rendu à temps':'rendu'); }});
  const typ=(TASK_TYPES.find(t=>t[0]===x.type)||TASK_TYPES[2])[1];
  return el('div',{class:'task'+(x.done?' done':'')+(late?' late':'')}, box,
    el('div',{style:{flex:1,minWidth:0}}, el('div',{class:'task-title',text:x.title}), el('div',{class:'row',style:{gap:'6px',marginTop:'3px'}}, courseTag(x.course), el('span',{class:'tag grey',text:typ}))),
    el('div',{class:'task-due hand',text:fmtTaskDue(x.due)}));
}
export function tasksSoonCard(){
  const t=today(); const soon=(S.settings.tasks||[]).filter(x=>!x.done && diffDays(t,x.due)<=3).sort((a,b)=>a.due<b.due?-1:1);
  if(!soon.length) return null;
  return el('div',{class:'card'}, el('div',{class:'row'}, el('h3',{text:'À rendre bientôt',style:{marginBottom:0}}), el('span',{class:'spacer'}), el('a',{href:'#',onclick:e=>{e.preventDefault();go('exams');},text:'Tout voir'})), el('div',{style:{marginTop:'10px'}}, soon.map(taskRow)));
}
export function tasksSection(){
  const root=el('div'); const st=S.settings; st.tasks=st.tasks||[];
  const t=today();
  root.append(el('h2',{text:'À rendre'}));
  const open=st.tasks.filter(x=>!x.done).sort((a,b)=>a.due<b.due?-1:1);
  const groups=[['En retard',x=>x.due<t],['Cette semaine',x=>x.due>=t&&diffDays(t,x.due)<=7],['Plus tard',x=>diffDays(t,x.due)>7]];
  if(!open.length) root.append(el('div',{class:'card empty muted',text:'Rien à rendre. Ajoute tes séries et tes TP ci-dessous.'}));
  groups.forEach(([title,fn])=>{ const items=open.filter(fn); if(items.length) root.append(el('div',{class:'card'}, el('h3',{text:title}), items.map(taskRow))); });
  const done=st.tasks.filter(x=>x.done).sort((a,b)=>(b.doneAt||'')<(a.doneAt||'')?-1:1).slice(0,6);
  if(done.length) root.append(el('details',{class:'card'}, el('summary',{text:'Rendus récemment'}), el('div',{style:{marginTop:'10px'}}, done.map(taskRow))));
  // add form
  const title=el('input',{type:'text',placeholder:'ex. Série 7'});
  const date=el('input',{type:'date',value:addDays(t,7)});
  let course=courses()[0]; const cc=Chips(courseOpts(),course,{onchange:v=>{ if(!v){cc.set(course);return;} course=v; }});
  let type='serie'; const tc=Chips(TASK_TYPES.map(([id,label])=>({id,label})),type,{onchange:v=>{ if(!v){tc.set(type);return;} type=v; }});
  let weeks=1; const wb=el('b',{text:'1'});
  const weeksTxt=el('span',{class:'muted small',text:'une seule fois'});
  const setW=n=>{ weeks=Math.max(1,Math.min(14,n)); wb.textContent=weeks; weeksTxt.textContent=weeks===1?'une seule fois':'chaque semaine, '+weeks+' fois (le numéro augmente tout seul)'; };
  root.append(el('div',{class:'card'}, el('h3',{text:'Ajouter à rendre'}),
    el('label',{class:'f',text:'Titre'}), title, el('label',{class:'f',text:'Pour le'}), date,
    el('label',{class:'f',text:'Cours'}), cc.el, el('label',{class:'f',text:'Type'}), tc.el,
    el('label',{class:'f',text:'Répéter'}), el('div',{class:'row'}, el('span',{class:'stepper'}, el('button',{class:'btn small',type:'button',text:'−',onclick:()=>setW(weeks-1)}), wb, el('button',{class:'btn small',type:'button',text:'+',onclick:()=>setW(weeks+1)})), weeksTxt),
    el('div',{class:'row',style:{marginTop:'18px'}}, el('button',{class:'btn primary',type:'button',text:'Ajouter',onclick:async()=>{
      if(!date.value){ toast('Choisis une date.','err'); return; }
      const base=title.value.trim()||(type==='tp'?'TP':'Série'); const m=/^(.*?)(\d+)\s*$/.exec(base);
      for(let i=0;i<weeks;i++){
        const ttl = m ? m[1]+(parseInt(m[2],10)+i) : (weeks>1? base+' (sem. '+(i+1)+')' : base);
        st.tasks.push({id:uid(), title:ttl, course, type, due:addDays(date.value,7*i), done:false});
      }
      const cutoff=addDays(t,-60); st.tasks=st.tasks.filter(x=>!(x.done && x.due<cutoff));
      await saveSettings(); toast(weeks>1?weeks+' rendus ajoutés':'Ajouté'); render(); }}))));
  return root;
}
export function viewAgenda(){ const root=el('div'); root.append(tasksSection(), el('div',{style:{height:'14px'}}), viewExams()); return root; }

