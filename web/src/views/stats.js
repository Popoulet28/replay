import { REASONS } from '../core/data.js';
import { addDays, el, fmtDate, today } from '../core/helpers.js';
import { allProblems, courses, topicsOf } from '../core/state.js';
import { streak } from '../srs/schedule.js';

/* ---------- Stats ---------- */
export function viewStats(){
  const root=el('div'); root.append(el('h2',{text:'Ton profil d’erreurs'}));
  const probs=allProblems();
  if (!probs.length){ root.append(el('div',{class:'card empty muted',text:'Ajoute quelques problèmes et tes tendances apparaîtront ici.'})); return root; }
  // reviews per day (14 days)
  const days=[]; for(let i=13;i>=0;i--) days.push(addDays(today(),-i));
  const perDay=Object.fromEntries(days.map(d=>[d,0])); let totalRev=0, okRev=0;
  for (const p of probs) for (const h of (p.history||[])){ totalRev++; if(h.r==='good'||h.r==='easy') okRev++; if(h.d in perDay) perDay[h.d]++; }
  const mx=Math.max(1,...Object.values(perDay));
  root.append(el('div',{class:'grid2'},
    el('div',{class:'card'}, el('h3',{text:'Révisions, 14 derniers jours'}), el('div',{class:'spark'}, days.map(d=>el('i',{title:fmtDate(d)+': '+perDay[d],style:{height:(perDay[d]/mx*100)+'%'}})))),
    el('div',{class:'card'}, el('h3',{text:'Global'}),
      el('div',{}, (()=>{const a=probs.filter(p=>!p.archived).length,m=probs.filter(p=>p.archived).length; return [el('b',{text:String(a)}),' actif'+(a===1?'':'s')+' · ', el('b',{text:String(m)}),' maîtrisé'+(m===1?'':'s')];})()),
      el('div',{}, el('b',{text:String(totalRev)}),' révision'+(totalRev===1?'':'s')+' · ', el('b',{text: totalRev? Math.round(okRev/totalRev*100)+'%':'—'}),' réussi'+(totalRev===1?'e':'es')),
      el('div',{}, (()=>{const n=streak(); return [el('b',{text:String(n)}),' jour'+(n===1?'':'s')+' d’affilée'];})()))));
  for (const c of courses()){
    const cp=probs.filter(p=>p.course===c); if(!cp.length) continue;
    const rc={}; let tagged=0; for(const p of cp) for(const r of (p.reasons||[])){ rc[r]=(rc[r]||0)+1; tagged++; }
    const card=el('div',{class:'card'}, el('h3',{text:c+' — pourquoi tu rates'}));
    if (!tagged) card.append(el('p',{class:'muted small',text:'Aucune raison indiquée pour l’instant.'}));
    REASONS.filter(r=>rc[r.id]).sort((a,b)=>rc[b.id]-rc[a.id]).forEach(r=>{
      const pct=Math.round(rc[r.id]/tagged*100);
      card.append(el('div',{class:'barrow'}, el('span',{text:r.label}), el('div',{class:'bar'}, el('i',{style:{width:pct+'%'}})), el('span',{class:'small',text:pct+'%'})));
    });
    const top=REASONS.filter(r=>rc[r.id]).sort((a,b)=>rc[b.id]-rc[a.id])[0];
    if (top && tagged>=3) card.append(el('p',{class:'small',style:{marginTop:'10px'}}, el('b',{text:'À travailler : '}), ADVICE[top.id]));
    // weak topics
    const tp={}; for(const p of cp){ const ts=topicsOf(p).length?topicsOf(p):['Sans thème']; for(const t of ts){ tp[t]=tp[t]||{n:0,again:0,rev:0}; tp[t].n++; for(const h of (p.history||[])){ tp[t].rev++; if(h.r==='again') tp[t].again++; } } }
    const rows=Object.entries(tp).sort((a,b)=>(b[1].n+b[1].again*2)-(a[1].n+a[1].again*2)).slice(0,6);
    card.append(el('hr',{class:'sep'}), el('h3',{text:'Thèmes les plus faibles'}));
    rows.forEach(([t,v])=>card.append(el('div',{class:'row small',style:{justifyContent:'space-between',padding:'4px 0'}}, el('span',{text:t}),
      el('span',{class:'muted',text: v.n+' problème'+(v.n===1?'':'s')+(v.rev?' · '+Math.round(v.again/v.rev*100)+'% “à revoir”':'')}))));
    root.append(card);
  }
  return root;
}
export const ADVICE = {
  start:'avant de calculer, écris ce qui est donné, ce qui est demandé et quel principe ou théorème les relie.',
  setup:'prends ton temps sur le schéma, le choix du système ou de la méthode — c’est là que tu perds le plus de points.',
  concept:'relis le cours sur ton thème le plus faible (ci-dessous) avant la prochaine série.',
  algebra:'garde les lettres jusqu’au bout et vérifie chaque ligne de calcul une fois.',
  sign:'fixe tes axes explicitement et vérifie les unités du résultat final à chaque fois.',
  other:'relis tes notes manuscrites sur ces problèmes pour trouver le point commun.'
};

