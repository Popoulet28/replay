import { addDays, diffDays, today } from '../core/helpers.js';
import { S, activeProblems, topicsOf } from '../core/state.js';

/* ---------- spaced repetition ---------- */
export function newSrs(){ return {ease:2.3, interval:0, reps:0, lapses:0, due:addDays(today(),1), last:null}; }
export function schedule(p, rating){
  const s = p.srs || newSrs(); const t = today();
  let ease=s.ease||2.3, iv=s.interval||0, reps=s.reps||0, lapses=s.lapses||0;
  if (rating==='again'){ lapses++; reps=0; iv=1; ease=Math.max(1.3, ease-0.2); }
  else if (rating==='hard'){ iv = reps===0 ? 1 : Math.max(1, Math.round(iv*1.2)); ease=Math.max(1.3, ease-0.15); reps++; }
  else if (rating==='good'){ iv = reps===0 ? 3 : Math.max(iv+1, Math.round(iv*ease)); reps++; }
  else if (rating==='easy'){ iv = reps===0 ? 5 : Math.max(iv+2, Math.round(iv*ease*1.3)); ease=Math.min(3, ease+0.15); reps++; }
  iv = Math.min(iv, 180);
  return {ease:Math.round(ease*100)/100, interval:iv, reps, lapses, due:addDays(t,iv), last:t};
}
export function upcomingExams(withinDays){
  const t=today();
  return (S.settings.exams||[]).filter(e=>e.date>=t && diffDays(t,e.date)<=withinDays).sort((a,b)=>a.date<b.date?-1:1);
}
export function examMatches(ex, p){ return p.course===ex.course && (!ex.topics || !ex.topics.length || topicsOf(p).some(t=>ex.topics.includes(t))); }
export function boostActive(){ return upcomingExams(S.settings.boostDays||7).length>0; }
export function dailyLimit(){ return boostActive() ? Math.max(S.settings.examLimit||3, S.settings.dailyLimit||1) : (S.settings.dailyLimit||1); }
export function reviewedToday(){ const t=today(); let n=0; for(const p of S.problems.values()) for(const h of (p.history||[])) if(h.d===t && !h.x) n++; return n; }
export function backlog(){
  const t=today(); const exams=upcomingExams(14);
  const items=[];
  for (const p of activeProblems()){
    const s=p.srs||newSrs();
    const ex = exams.find(e=>examMatches(e,p));
    let due = s.due<=t;
    if (!due && ex){ const start=addDays(ex.date,-14); if(s.due>ex.date && (!s.last || s.last<start)) due=true; }
    if (s.last===t) due=false; // never twice in one day automatically
    if (due) items.push({p, ex:!!ex, due:s.due, lapses:s.lapses||0});
  }
  items.sort((a,b)=> (b.ex-a.ex) || (a.due<b.due?-1:a.due>b.due?1:0) || (b.lapses-a.lapses));
  return items.map(i=>i.p);
}
export function todayQueue(){ const left=Math.max(0, dailyLimit()-reviewedToday()); return backlog().slice(0,left); }
export function streak(){
  const days=new Set(); for(const p of S.problems.values()){ if(p.created) days.add(p.created); for(const h of (p.history||[])) days.add(h.d); } for(const x of (S.settings.tasks||[])) if(x.done&&x.doneAt) days.add(x.doneAt);
  let d=today(); if(!days.has(d)) d=addDays(d,-1); let n=0; while(days.has(d)){ n++; d=addDays(d,-1); } return n;
}

