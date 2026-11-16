import { backupControls } from '../core/backup.js';
import { DEFAULT_COURSES } from '../core/data.js';
import { el } from '../core/helpers.js';
import { S, courses } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { render } from '../ui/chrome.js';
import { modeToggle } from './today.js';

/* ---------- Settings ---------- */
export function viewSettings(){
  const root=el('div'); root.append(el('h2',{text:'Réglages'}));
  const st=S.settings;
  function stepper(key, min, max){
    const b=el('b',{text:String(st[key])});
    return el('span',{class:'stepper'},
      el('button',{class:'btn small',text:'−',onclick:()=>{ st[key]=Math.max(min,st[key]-1); b.textContent=st[key]; saveSettings(); }}), b,
      el('button',{class:'btn small',text:'+',onclick:()=>{ st[key]=Math.min(max,st[key]+1); b.textContent=st[key]; saveSettings(); }}));
  }
  root.append(el('div',{class:'card'},
    el('h3',{text:'Charge de travail'}),
    el('div',{class:'row',style:{justifyContent:'space-between',padding:'8px 0'}}, el('div',{}, el('div',{text:'Problèmes par jour'}), el('div',{class:'muted small',text:'Le reste attend le jour suivant.'})), stepper('dailyLimit',1,10)),
    el('div',{class:'row',style:{justifyContent:'space-between',padding:'8px 0'}}, el('div',{}, el('div',{text:'Par jour la semaine d’un contrôle'}), el('div',{class:'muted small',text:'Utilisé quand un contrôle approche.'})), stepper('examLimit',1,15)),
    el('div',{class:'row',style:{justifyContent:'space-between',padding:'8px 0'}}, el('div',{}, el('div',{text:'Révision renforcée (jours avant)'})), stepper('boostDays',1,21)),
    el('div',{class:'row',style:{justifyContent:'space-between',padding:'8px 0'}}, el('div',{}, el('div',{text:'Mode par défaut'})), modeToggle())));
  const pen=el('input',{type:'checkbox',checked:!!st.penOnly,style:{width:'24px',height:'24px'},onchange:()=>{ st.penOnly=pen.checked; saveSettings(); }});
  root.append(el('div',{class:'card'}, el('h3',{text:'Stylet'}),
    el('label',{class:'row',style:{cursor:'pointer'}}, pen, el('span',{}, 'Anti-paume : dès que le stylet est utilisé, ignorer les doigts dans les zones d’écriture')),
    el('p',{class:'muted small',text:'Pour écrire aussi dans les champs de texte, utilise la conversion écriture → texte de ta tablette, ou le clavier manuscrit de Gboard (Gboard → Paramètres → Langues → ajouter la disposition Écriture manuscrite).'})));
  // courses & topics
  const cardT=el('div',{class:'card'}, el('h3',{text:'Cours & thèmes'}));
  for (const c of courses()){
    const custom=(st.customTopics||{})[c]||[];
    cardT.append(el('div',{style:{margin:'10px 0'}}, el('b',{text:c}),
      el('div',{class:'muted small',text:(DEFAULT_COURSES[c]||[]).join(' · ')}),
      custom.length? el('div',{class:'chips',style:{marginTop:'6px'}}, custom.map(t=>el('button',{class:'chip',text:t+' ✕',title:'Retirer',onclick:()=>{ st.customTopics[c]=custom.filter(x=>x!==t); saveSettings(); render(); }}))) : null));
  }
  const newCourse=el('input',{type:'text',placeholder:'Ajouter un cours, ex. Physique numérique'});
  cardT.append(el('div',{class:'row',style:{marginTop:'10px'}}, el('div',{style:{flex:1}},newCourse), el('button',{class:'btn',text:'Ajouter le cours',onclick:()=>{ const v=newCourse.value.trim(); if(!v||courses().includes(v)) return; st.extraCourses=(st.extraCourses||[]).concat([v]); saveSettings(); render(); }})));
  root.append(cardT);
  root.append(el('div',{class:'card'}, el('h3',{text:'Tes données'}),
    el('p',{class:'small',text: S.mode==='local' ? 'Tes problèmes et photos sont enregistrés sur ta tablette. Fais une sauvegarde de temps en temps : si tu désinstalles l’app, tout est effacé.' : 'Le stockage est bloqué ici : rien ne sera gardé après fermeture de la page.'}),
    backupControls()));
  return root;
}

