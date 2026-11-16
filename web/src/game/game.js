import { addDays, diffDays, el, parseYmd, today } from '../core/helpers.js';
import { S, courseColor, courseTag, courses, shortCourse } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { NB, nbCourseOf } from '../notes/store.js';
import { buzz, go, toast } from '../ui/chrome.js';
import { viewStats } from '../views/stats.js';

/* ================= Game layer ================= */
export const XP_RATE={again:5,hard:10,good:15,easy:15};
export const TASK_XP={serie:50,tp:60,autre:20};
export const ONTIME_BONUS=20, PROBLEM_XP=10, DAY_XP=10, QUEST_XP=75;
export const RANKS=['Quark','Électron','Atome','Molécule','Grain de poussière','Astéroïde','Lune','Planète','Étoile','Géante rouge','Pulsar','Trou noir','Galaxie','Amas de galaxies','Univers observable'];
export function levelFor(xp){ let L=0; while(xp >= 50*(L+1)*(L+2)) L++; return L+1; }
export function levelBounds(level){ return [50*(level-1)*level, 50*level*(level+1)]; }
export const rankFor = lvl => RANKS[Math.min(lvl-1, RANKS.length-1)];
export function weekStart(d){ const x=parseYmd(d); const back=(x.getDay()+6)%7; return addDays(d,-back); }
export function reviewXP(h){ return Math.round((XP_RATE[h.r]||0)*(h.m==='full'?1.5:1)); }
export function taskXP(x){ return (TASK_XP[x.type]||20) + (x.doneAt && x.doneAt<=x.due ? ONTIME_BONUS : 0); }

export function questsFor(ws, ctx){
  const we=addDays(ws,6), inW=d=>d && d>=ws && d<=we;
  const tasksW=(S.settings.tasks||[]).filter(x=>inW(x.due));
  const doneW=tasksW.filter(x=>x.done).length;
  const rev=ctx.revByDay, add=ctx.addByDay;
  let nRev=0, nAdd=0, nDays=0;
  for(let i=0;i<7;i++){ const d=addDays(ws,i); nRev+=rev[d]||0; nAdd+=add[d]||0; if(ctx.activeDays.has(d)) nDays++; }
  return [
    {id:'series', label: tasksW.length? 'Rendre toutes tes séries et TP de la semaine' : 'Rendre tes séries de la semaine (aucune prévue)', cur:doneW, goal:Math.max(1,tasksW.length), done: tasksW.length>0 && doneW===tasksW.length},
    {id:'replay', label:'Refaire 5 problèmes', cur:Math.min(nRev,5), goal:5, done:nRev>=5},
    {id:'add', label:'Ajouter 3 problèmes ratés', cur:Math.min(nAdd,3), goal:3, done:nAdd>=3},
    {id:'days', label:'Être actif 4 jours', cur:Math.min(nDays,4), goal:4, done:nDays>=4}
  ];
}

export function computeGame(){
  const c={}; courses().forEach(k=>c[k]=0);
  const add=(course,x)=>{ c[course]=(c[course]||0)+x; };
  const g={reviews:0, easy:0, full:0, added:0, seriesDone:0, onTime:0};
  const activeDays=new Set(), revByDay={}, addByDay={};
  for(const p of S.problems.values()){
    add(p.course, PROBLEM_XP); g.added++; if(p.created){ addByDay[p.created]=(addByDay[p.created]||0)+1; activeDays.add(p.created); }
    for(const h of (p.history||[])){ add(p.course, reviewXP(h)); g.reviews++; if(h.r==='easy') g.easy++; if(h.m==='full') g.full++; activeDays.add(h.d); revByDay[h.d]=(revByDay[h.d]||0)+1; }
  }
  if(typeof NB!=='undefined' && NB.ready){ for(const n of NB.nodes.values()){ if(n.type!=='note') continue; const c=nbCourseOf(n); if(!c) continue; add(c,5); if(n.created) activeDays.add(n.created); for(const st of (n.stamps||[])) if(st.t==='q'&&st.done) add(c,10); } }
  for(const x of (S.settings.tasks||[])){ if(!x.done) continue; add(x.course, taskXP(x)); g.seriesDone++; if(x.doneAt && x.doneAt<=x.due) g.onTime++; if(x.doneAt) activeDays.add(x.doneAt); }
  const ctx={activeDays, revByDay, addByDay};
  // quests: every week from the first activity to this week
  let questsDone=0; const t=today(); const thisWeek=weekStart(t);
  const firstDay=[...activeDays].sort()[0];
  if(firstDay){ for(let w=weekStart(firstDay); w<=thisWeek; w=addDays(w,7)) questsDone+=questsFor(w,ctx).filter(q=>q.done).length; }
  // streaks
  let best=0, run=0, prev=null; [...activeDays].sort().forEach(d=>{ run = (prev && diffDays(prev,d)===1) ? run+1 : 1; best=Math.max(best,run); prev=d; });
  let cur=0, d=t; if(!activeDays.has(d)) d=addDays(d,-1); while(activeDays.has(d)){ cur++; d=addDays(d,-1); }
  const bonus = activeDays.size*DAY_XP + questsDone*QUEST_XP;
  const courseXP=Object.values(c).reduce((a,b)=>a+b,0);
  const total = courseXP + bonus;
  const level=levelFor(total);
  const courseLv={}; for(const k in c) courseLv[k]=levelFor(c[k]);
  Object.assign(g,{courses:c, courseLv, total, level, rank:rankFor(level), questsDone, best, streak:cur, activeDays:activeDays.size, ctx, thisWeek});
  g.badges=BADGES.filter(b=>b.test(g)).map(b=>b.id);
  return g;
}

export const BADGES=[
  {id:'honest', name:'Honnête', desc:'Ajouter ton premier problème raté', test:g=>g.added>=1},
  {id:'first-serie', name:'Premier rendu', desc:'Cocher ta première série', test:g=>g.seriesDone>=1},
  {id:'ontime-5', name:'Toujours à l’heure', desc:'Rendre 5 séries à temps', test:g=>g.onTime>=5},
  {id:'serie-20', name:'Machine à séries', desc:'Rendre 20 séries ou TP', test:g=>g.seriesDone>=20},
  {id:'replay-25', name:'Replay ×25', desc:'Refaire 25 problèmes', test:g=>g.reviews>=25},
  {id:'replay-100', name:'Replay ×100', desc:'Refaire 100 problèmes', test:g=>g.reviews>=100},
  {id:'easy-10', name:'Ça devient facile', desc:'Noter 10 problèmes « facile »', test:g=>g.easy>=10},
  {id:'full-10', name:'Jusqu’au bout', desc:'Faire 10 révisions en mode complet', test:g=>g.full>=10},
  {id:'collector', name:'Collectionneur', desc:'Ajouter 25 problèmes', test:g=>g.added>=25},
  {id:'streak-7', name:'Semaine parfaite', desc:'7 jours actifs d’affilée', test:g=>g.best>=7},
  {id:'streak-30', name:'Orbite stable', desc:'30 jours actifs d’affilée', test:g=>g.best>=30},
  {id:'quests-4', name:'Quêteur', desc:'Réussir 4 quêtes hebdo', test:g=>g.questsDone>=4},
  {id:'all-courses', name:'Touche-à-tout', desc:'Gagner de l’XP dans tous tes cours', test:g=>Object.values(g.courses).every(x=>x>0)},
  {id:'specialist', name:'Spécialiste', desc:'Atteindre le niveau 5 dans un cours', test:g=>Object.values(g.courseLv).some(l=>l>=5)},
  {id:'ready', name:'Paré au contrôle', desc:'Créer une fiche de révision', test:()=>(S.settings.exams||[]).some(e=>e.sheet)}
];

/* level-ups and new badges, announced once */
export let progressBusy=false;
export async function checkProgress(){
  if(!S.loaded || progressBusy) return; progressBusy=true;
  try{
    const g=computeGame(); const seen=S.settings.game;
    if(!seen){ S.settings.game={level:g.level, courseLv:g.courseLv, badges:g.badges}; await saveSettings(); return; }
    const msgs=[];
    if(g.level>seen.level) msgs.push({big:'Niveau '+g.level, small: rankFor(g.level)!==rankFor(seen.level) ? 'Tu deviens '+g.rank+' !' : 'Encore '+(levelBounds(g.level)[1]-g.total)+' XP pour le suivant'});
    for(const k in g.courseLv){ const before=(seen.courseLv||{})[k]||1; if(g.courseLv[k]>before) msgs.push({big:k+' niv. '+g.courseLv[k], small:'Ta stat monte !', color:courseColor(k)}); }
    const nb=g.badges.filter(b=>!(seen.badges||[]).includes(b));
    nb.forEach(id=>{ const b=BADGES.find(x=>x.id===id); msgs.push({big:'Badge : '+b.name, small:b.desc}); });
    const changed = g.level!==seen.level || nb.length || JSON.stringify(g.courseLv)!==JSON.stringify(seen.courseLv);
    if(changed){ S.settings.game={level:Math.max(g.level,seen.level), courseLv:g.courseLv, badges:[...new Set((seen.badges||[]).concat(g.badges))]}; await saveSettings(); }
    msgs.forEach((m,i)=>setTimeout(()=>celebrate(m), i*2600));
  } finally { progressBusy=false; }
}
export function celebrate(m){
  const n=el('div',{class:'celebrate',role:'status'}, el('div',{class:'cb-big'}, el('span',{class:'hl swipe',text:m.big})), el('div',{class:'cb-small hand',text:m.small}));
  if(m.color) n.style.setProperty('--cc',m.color);
  document.body.append(n); buzz([30,60,30]); setTimeout(()=>n.classList.add('out'),2200); setTimeout(()=>n.remove(),2600);
}
export function xpToast(x, what){ toast('+'+x+' XP · '+shortCourse(what),'xp'); buzz(12); }

/* ---- UI pieces ---- */
export function ruler(frac, color){
  const r=el('div',{class:'ruler'}, el('i',{style:{width:Math.max(0,Math.min(100,frac*100))+'%'}}));
  if(color) r.style.setProperty('--fill',color);
  return r;
}
export function characterCard(g){
  const [lo,hi]=levelBounds(g.level);
  const card=el('div',{class:'card char'},
    el('div',{class:'char-top'},
      el('div',{class:'char-lvl hand'}, el('span',{class:'hl',text:String(g.level)})),
      el('div',{style:{flex:1,minWidth:'180px'}},
        el('div',{class:'muted small',text:'Niveau '+g.level}),
        el('div',{class:'char-rank',text:g.rank}),
        el('div',{class:'muted small',text: g.level<RANKS.length ? 'Prochain rang : '+rankFor(g.level+1) : 'Rang maximal atteint'})),
      el('div',{class:'char-streak'}, el('div',{class:'hand',text:String(g.streak)}), el('div',{class:'muted small',text: 'jour'+(g.streak>1?'s':'')+' d’affilée'}))),
    el('div',{class:'row small',style:{justifyContent:'space-between',margin:'14px 0 6px'}}, el('b',{text:g.total+' XP'}), el('span',{class:'muted',text:(hi-g.total)+' XP avant le niveau '+(g.level+1)})),
    ruler((g.total-lo)/(hi-lo)));
  const stats=el('div',{class:'stats-list'});
  for(const k of courses()){
    const xp=g.courses[k]||0, lv=g.courseLv[k]||1, [a,b]=levelBounds(lv);
    const row=el('div',{class:'stat-row'},
      el('div',{class:'stat-name'}, courseTag(k)),
      el('div',{class:'stat-lv hand',text:'niv. '+lv}),
      ruler((xp-a)/(b-a), courseColor(k)),
      el('div',{class:'stat-xp muted small',text:xp+' XP'}));
    stats.append(row);
  }
  card.append(el('h3',{text:'Tes stats',style:{marginTop:'22px'}}), stats,
    el('p',{class:'muted small',style:{marginTop:'12px'},text:'Série rendue +50 XP (TP +60), +20 si à temps · problème ajouté +10 · replay +5 à +15 (×1,5 en mode complet) · jour actif +10 · quête hebdo +75.'}));
  return card;
}
export function questsCard(g, compact){
  const qs=questsFor(g.thisWeek, g.ctx);
  const left=6-((parseYmd(today()).getDay()+6)%7);
  const card=el('div',{class:'card'},
    el('div',{class:'row'}, el('h3',{text:'Quêtes de la semaine',style:{marginBottom:0}}), el('span',{class:'spacer'}), el('span',{class:'muted small',text: left===0?'se termine ce soir':'encore '+left+' jour'+(left>1?'s':'')})));
  const list=el('div',{class:'quests'});
  qs.forEach(q=>list.append(el('div',{class:'quest'+(q.done?' done':'')},
    el('span',{class:'q-box',text:q.done?'✓':''}),
    el('div',{style:{flex:1}}, el('div',{class:'q-label',text:q.label}), compact?null:ruler(q.cur/q.goal)),
    el('span',{class:'q-count hand',text: q.done?'+'+QUEST_XP+' XP':q.cur+'/'+q.goal}))));
  card.append(list);
  if(compact) card.append(el('div',{class:'row',style:{marginTop:'8px'}}, el('a',{href:'#',onclick:e=>{e.preventDefault();go('stats');},text:'Voir ton profil'})));
  return card;
}
export function badgesCard(g){
  const grid=el('div',{class:'badges'});
  BADGES.forEach((b,i)=>{ const on=g.badges.includes(b.id);
    const st=el('div',{class:'badge'+(on?' on':''),title:b.desc}, el('div',{class:'stamp'}, el('span',{text:on?b.name:'?'})), el('div',{class:'small muted b-desc',text:b.desc}));
    st.style.setProperty('--rot', ((i*37)%11-5)+'deg'); grid.append(st); });
  return el('div',{class:'card'}, el('div',{class:'row'}, el('h3',{text:'Badges',style:{marginBottom:0}}), el('span',{class:'spacer'}), el('span',{class:'muted small',text:g.badges.length+' / '+BADGES.length})), grid);
}
export function levelStrip(g){
  const [lo,hi]=levelBounds(g.level);
  return el('a',{href:'#',class:'lvl-strip',onclick:e=>{e.preventDefault();go('stats');}},
    el('span',{class:'hand lvl-n'}, el('span',{class:'hl',text:String(g.level)})),
    el('div',{style:{flex:1}}, el('div',{class:'small'}, el('b',{text:g.rank}), ' · '+(hi-g.total)+' XP avant le niveau '+(g.level+1)), ruler((g.total-lo)/(hi-lo))));
}
export function viewProfile(){
  const g=computeGame(); const root=el('div');
  root.append(el('h2',{text:'Ton personnage'}), characterCard(g), questsCard(g,false), badgesCard(g), el('div',{style:{height:'10px'}}), viewStats());
  return root;
}

