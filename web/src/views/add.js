import { REASONS } from '../core/data.js';
import { el, today, uid } from '../core/helpers.js';
import { storeImage } from '../core/images.js';
import { S, courseOpts, courses, topicsFor } from '../core/state.js';
import { saveProblem, saveSettings } from '../core/storage.js';
import { newSrs } from '../srs/schedule.js';
import { modal, render, toast } from '../ui/chrome.js';
import { Chips, InkPad, PhotoField } from '../ui/components.js';

/* ---------- Add ---------- */
export let addCourse = null;
export function viewAdd(){
  const root=el('div');
  const card=el('div',{class:'card'}); root.append(card);
  card.append(el('h2',{text:'Ajouter un problème'}), el('p',{class:'muted small',text:'Seul l’énoncé est obligatoire. Astuce : tu peux aussi coller une capture d’écran n’importe où sur cette page.'}));
  const prob=PhotoField(), sol=PhotoField();
  const probText=el('textarea',{placeholder:'Ou tape-le — utilise $...$ pour les formules, ex. $F = ma$'});
  const solText=el('textarea',{placeholder:'Étapes clés de la solution (facultatif)'});
  const source=el('input',{type:'text',placeholder:'ex. Série 6, ex. 3'});
  const cs=courses(); if(!addCourse || !cs.includes(addCourse)) addCourse=cs[0];
  const topicBox=el('div');
  let topicChips;
  function drawTopics(){
    const prev = topicChips ? topicChips.get().filter(t=>topicsFor(addCourse).includes(t)) : [];
    const add=el('button',{type:'button',class:'chip',text:'＋ nouveau thème',onclick:()=>{
      const inp=el('input',{type:'text',placeholder:'Nom du thème'}); let close;
      close=modal(el('div',{}, el('h3',{text:'Nouveau thème pour '+addCourse}), inp,
        el('div',{class:'row',style:{marginTop:'12px'}}, el('span',{class:'spacer'}), el('button',{class:'btn ghost',text:'Annuler',onclick:()=>close()}),
          el('button',{class:'btn primary',text:'Ajouter',onclick:()=>{ const t=inp.value.trim(); if(!t) return; const ct=S.settings.customTopics||(S.settings.customTopics={}); (ct[addCourse]=ct[addCourse]||[]); if(!topicsFor(addCourse).includes(t)) ct[addCourse].push(t); saveSettings(); close(); const keep=topicChips.get(); drawTopics(); topicChips.set(keep.concat([t])); }}))));
      setTimeout(()=>inp.focus(),50);
    }});
    topicChips = Chips(topicsFor(addCourse), prev, {multi:true, extra:add});
    topicBox.replaceChildren(topicChips.el);
  }
  const courseChips=Chips(courseOpts(), addCourse, {onchange:v=>{ if(!v){ courseChips.set(addCourse); return; } addCourse=v; topicChips=null; drawTopics(); }});
  drawTopics();
  const reasonChips=Chips(REASONS, [], {multi:true});
  const ink=InkPad({height:200, hint:'Pourquoi tu l’as raté ? Écris ou dessine au stylet…'});
  const noteText=el('input',{type:'text',placeholder:'…ou tape une courte note'});

  card.append(
    el('label',{class:'f'},'Énoncé'), prob.el, el('div',{style:{marginTop:'10px'}}, probText),
    el('label',{class:'f'},'Cours'), courseChips.el,
    el('label',{class:'f'},'Thèmes ', el('span',{class:'muted',text:'(un ou plusieurs, facultatif)'})), topicBox,
    el('label',{class:'f'},'Pourquoi tu l’as raté ? ', el('span',{class:'muted',text:'(plusieurs choix possibles)'})), reasonChips.el,
    el('label',{class:'f'},'Note ', el('span',{class:'muted',text:'(facultatif)'})), ink.el, el('div',{style:{marginTop:'10px'}}, noteText),
    el('label',{class:'f'},'Solution correcte ', el('span',{class:'muted',text:'(facultatif — cachée jusqu’à ce que tu réessaies)'})), sol.el, el('div',{style:{marginTop:'10px'}}, solText),
    el('label',{class:'f'},'Provenance ', el('span',{class:'muted',text:'(facultatif)'})), source);
  const saveBtn=el('button',{class:'btn primary big',text:'Enregistrer'});
  card.append(el('div',{class:'row',style:{marginTop:'22px'}}, saveBtn));

  // paste screenshots
  const onPaste = e=>{
    if (S.view!=='add') { document.removeEventListener('paste', onPaste); return; }
    const item=[...(e.clipboardData&&e.clipboardData.items||[])].find(i=>i.type.startsWith('image/'));
    if (!item) return; e.preventDefault(); const f=item.getAsFile();
    (prob.has()? sol : prob).take(f); toast(prob.has()?'Collé comme solution':'Collé comme énoncé');
  };
  document.addEventListener('paste', onPaste);

  saveBtn.addEventListener('click', async ()=>{
    if (!prob.has() && !probText.value.trim()){ toast('Ajoute d’abord une photo ou tape l’énoncé.','err'); return; }
    saveBtn.disabled=true; saveBtn.textContent='Enregistrement…';
    try{
      const noteBlob = ink.isEmpty()? null : await ink.toBlob();
      const [pi, si, ni] = await Promise.all([storeImage(prob.get()), storeImage(sol.get()), storeImage(noteBlob)]);
      const p = { id:uid(), created:today(), createdAt:Date.now(), course:addCourse, topics:topicChips.get(),
        reasons:reasonChips.get(), source:source.value.trim()||null,
        problemImg:pi, problemText:probText.value.trim()||null, solutionImg:si, solutionText:solText.value.trim()||null,
        noteImg:ni, noteText:noteText.value.trim()||null, srs:newSrs(), history:[], archived:false };
      const ok = await saveProblem(p);
      if (ok===false){ S.problems.delete(p.id); saveBtn.disabled=false; saveBtn.textContent='Enregistrer'; return; }
      toast('Enregistré · +10 XP — il revient demain.');
      document.removeEventListener('paste', onPaste);
      render(); window.scrollTo(0,0);
    }catch(e){ console.warn(e); toast('Problème lors de l’enregistrement des images.','err'); saveBtn.disabled=false; saveBtn.textContent='Enregistrer'; }
  });
  return root;
}

