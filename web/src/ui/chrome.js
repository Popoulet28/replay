import { el } from '../core/helpers.js';
import { S, activeProblems } from '../core/state.js';
import { checkProgress, viewProfile } from '../game/game.js';
import { viewTools } from '../tools/view.js';
import { viewAdd } from '../views/add.js';
import { viewCours } from '../views/cours.js';
import { viewLibrary } from '../views/library.js';
import { viewReview } from '../views/review.js';
import { viewSettings } from '../views/settings.js';
import { viewAgenda } from '../views/tasks.js';
import { viewToday } from '../views/today.js';

/* ---------- UI chrome ---------- */
export const VIEWS = [['today','Aujourd’hui'],['cours','Cours'],['add','Ajouter'],['library','Carnet'],['exams','Agenda'],['tools','Outils'],['stats','Profil']];
export function go(v){ S.view=v; if(v!=='review') S.session=null; render(); window.scrollTo(0,0); }
export function renderNav(){
  const nav=document.getElementById('nav'); nav.replaceChildren();
  for (const [id,label] of VIEWS)
    nav.append(el('button',{class: (S.view===id || (S.view==='review'&&id==='today'))?'on':'', onclick:()=>go(id)}, el('span',{text:label})));
}
export function renderStatus(){
  const st=document.getElementById('status');
  if (!S.loaded){ st.textContent='Ouverture du carnet…'; return; }
  const n=activeProblems().length;
  const where = S.mode==='cloud' ? (S.stale?'Enregistré sur ton compte · peut-être pas à jour':'Enregistré sur ton compte') : S.mode==='local' ? 'Enregistré sur cet appareil uniquement' : 'Pas d’enregistrement — stockage bloqué';
  st.replaceChildren(el('b',{text:n+' problème'+(n===1?'':'s')}), el('span',{class:'where',text:where}));
}
export function render(){
  renderNav(); renderStatus();
  const v=document.getElementById('view'); v.replaceChildren();
  if (!S.loaded){ v.append(el('div',{class:'card empty'}, el('div',{class:'muted',text:'Ouverture du carnet…'}))); return; }
  const fn = {today:viewToday, add:viewAdd, review:viewReview, library:viewLibrary, stats:viewProfile, exams:viewAgenda, tools:viewTools, cours:viewCours, settings:viewSettings}[S.view] || viewToday;
  v.append(fn());
  setTimeout(checkProgress, 400);
}
/* re-render on remote data only where it can't destroy something in progress */
export function refresh(){
  renderStatus();
  if (!S.loaded){ render(); return; }
  if (['add','review'].includes(S.view)) return;
  if (document.getElementById('layer').childElementCount) return;
  const a=document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && document.getElementById('view').contains(a)) return;
  render();
}
export function toast(msg, kind){
  let box=document.getElementById('toasts'); if(!box){ box=el('div',{id:'toasts','aria-live':'polite'}); document.body.append(box); }
  const t=el('div',{class:'toast'+(kind==='err'?' err':'')+(kind==='xp'?' xp':''), text:msg}); box.append(t);
  while(box.children.length>3) box.firstChild.remove();
  setTimeout(()=>{ t.classList.add('bye'); setTimeout(()=>t.remove(),300); }, kind==='err'?5000:2400);
}
export function buzz(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
export function modal(content){
  const layer=document.getElementById('layer');
  const back=el('div',{class:'modal-back', onclick:e=>{ if(e.target===back) close(); }});
  const box=el('div',{class:'modal'}); box.append(content); back.append(box); layer.append(back);
  function close(){ back.remove(); refresh(); }
  return close;
}
export function confirmBox(text, okLabel){
  return new Promise(res=>{
    let close;
    const c=el('div',{}, el('p',{text, style:{fontSize:'17px',marginTop:0}}),
      el('div',{class:'row'}, el('span',{class:'spacer'}),
        el('button',{class:'btn ghost',text:'Annuler',onclick:()=>{close();res(false);}}),
        el('button',{class:'btn primary',text:okLabel||'OK',onclick:()=>{close();res(true);}})));
    close=modal(c);
  });
}
export function viewImage(src){
  const layer=document.getElementById('layer'); let zoom=false;
  const img=el('img',{src, style:{width:'100%'}});
  const v=el('div',{class:'viewer'}, img,
    el('div',{class:'close row'},
      el('button',{class:'btn small',text:'Zoomer',onclick:()=>{ zoom=!zoom; img.style.width=zoom?'220%':'100%'; }}),
      el('button',{class:'btn small primary',text:'Fermer',onclick:()=>{ v.remove(); }})));
  layer.append(v);
}

