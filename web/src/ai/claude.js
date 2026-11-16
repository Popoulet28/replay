import { REASON_LABEL } from '../core/data.js';
import { el, fmtDate, today } from '../core/helpers.js';
import { imgBlob } from '../core/images.js';
import { S, activeProblems, topicsFor, topicsOf } from '../core/state.js';
import { saveSettings } from '../core/storage.js';
import { examMatches } from '../srs/schedule.js';
import { modal, refresh, toast } from '../ui/chrome.js';
import { mathText } from '../ui/math.js';

/* ================= Claude helpers ================= */
S.ai = undefined; S.aiImg = false; S.aiOff = false;
export async function initAI(){
  const api=(window.claude && typeof window.claude.use==='function')?window.claude:null;
  if(!api){ S.ai=null; return; }
  try{
    const f=await api.use('sample'); S.ai=f||null;
    if(f){ const lim=await f.limits().catch(()=>null); S.aiImg=!!(lim&&lim.images); }
  }catch(e){ S.ai=null; }
  refresh();
}
export function aiAvailable(){ return !!S.ai && !S.aiOff; }
export const AI_ERR = {
  rate_limited:'Trop de demandes pour le moment. Réessaie dans quelques minutes.',
  session_expired:'Reconnecte-toi à Claude, puis réessaie.',
  image_rejected:'Une image a été refusée (trop grande ou format non pris en charge).',
  refused:'Claude n’a pas pu répondre à cette demande.',
  empty_completion:'Pas de réponse. Réessaie.',
  invalid_json:'La réponse était mal formée. Réessaie.',
  upstream_error:'Problème de connexion. Réessaie.',
  prompt_too_large:'Trop de contenu à envoyer d’un coup.'
};
export function aiErrorText(e){
  const c=e&&e.code;
  if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(c)){ S.aiOff=true; return 'Claude n’est pas autorisé pour cette app. Recharge la page pour qu’il te redemande l’accès.'; }
  if(c==='cancelled') return '';
  return AI_ERR[c]||'Erreur. Réessaie.';
}
export async function refBlob(ref){
  if(!ref) return null;
  try{ const b=await imgBlob(ref); return b && /^image\/(jpeg|png|webp|gif)/.test(b.type)?b:null; }catch(e){ return null; }
}
/* returns {blobs, note} with a description of each attached image in order */
export async function problemImages(p, withSolution){
  const out={blobs:[], labels:[]};
  if(!S.aiImg) return out;
  const pairs=[[p.problemImg,'l’énoncé'], withSolution?[p.solutionImg,'la solution correcte (à utiliser seulement pour être juste, ne la révèle jamais)']:null].filter(Boolean);
  for(const [ref,label] of pairs){ const b=await refBlob(ref); if(b){ out.blobs.push(b); out.labels.push(label); } }
  return out;
}
export function imgNote(labels, extra){
  const all=labels.concat(extra||[]);
  return all.length ? 'Images jointes, dans l’ordre : '+all.map((l,i)=>'image '+(i+1)+' = '+l).join(' ; ')+'.' : '';
}
export function problemContext(p){
  const L=[];
  L.push('Cours : '+p.course);
  if(topicsOf(p).length) L.push('Thèmes : '+topicsOf(p).join(', '));
  if((p.reasons||[]).length) L.push('Il l’avait raté parce que : '+p.reasons.map(r=>REASON_LABEL[r]||r).join(', '));
  if(p.noteText) L.push('Sa note : '+p.noteText);
  if(p.problemText) L.push('Énoncé (texte) : '+p.problemText);
  if(p.solutionText) L.push('Solution (texte, ne pas révéler) : '+p.solutionText);
  return L.join('\n');
}
export const STYLE_RULES='Réponds en français, en tutoyant. Texte simple sans Markdown (pas de **, pas de #). Formules en LaTeX entre $...$.';

export function stopBtn(getCtl){ return el('button',{class:'btn small ghost',type:'button',text:'Arrêter',style:{display:'none'},onclick:()=>{ const c=getCtl(); c&&c.abort(); }}); }

/* ---- 1. Hint ---- */
export function hintBox(p, s){
  if(!aiAvailable()) return null;
  if(!(p.problemText || (S.aiImg && p.problemImg))) return null;
  s.hints = s.hints || {}; const hints = s.hints[p.id] = s.hints[p.id] || [];
  const list=el('div',{class:'hints'});
  const draw=()=>list.replaceChildren(...hints.map((h,i)=>el('div',{class:'hint'}, el('span',{class:'hand hint-n',text:'indice '+(i+1)}), mathText(h,'ai-text'))));
  draw();
  const live=el('div',{class:'ai-live',hidden:true});
  let ctl=null; const stop=stopBtn(()=>ctl);
  const btn=el('button',{class:'btn ai',type:'button',text: hints.length?'Un autre indice':'Un indice'});
  if(hints.length>=4){ btn.disabled=true; btn.textContent='4 indices donnés'; }
  btn.addEventListener('click', async ()=>{
    const n=hints.length+1; if(n>4) return;
    btn.disabled=true; stop.style.display=''; live.hidden=false; live.className='ai-live thinking'; live.textContent='Claude réfléchit…';
    ctl=new AbortController();
    try{
      const im=await problemImages(p,true);
      const prompt=['Tu aides un étudiant de 1re année de physique à l’Université de Genève à refaire un exercice qu’il avait raté. Il travaille seul et veut un indice, pas la solution.',
        problemContext(p), imgNote(im.labels),
        hints.length?'Indices déjà donnés :\n'+hints.map((h,i)=>(i+1)+'. '+h).join('\n'):'Aucun indice donné pour l’instant.',
        'Donne l’indice n°'+n+' (4 au maximum). Progression : 1 = quelle idée ou quel principe utiliser ; 2 = comment poser le problème (système, schéma, repère ou méthode) ; 3 = la prochaine étape concrète ; 4 = presque toute la démarche, sans le résultat final.',
        'Règles : 1 à 3 phrases. Ne donne jamais le résultat final ni la solution complète. Ne répète pas les indices précédents. '+STYLE_RULES].filter(Boolean).join('\n\n');
      const opts={signal:ctl.signal, cache:false, onText:({text})=>{ live.className='ai-live'; live.textContent=text; }};
      if(im.blobs.length) opts.images=im.blobs;
      const {text}=await S.ai(prompt, opts);
      hints.push(text.trim()); draw(); live.hidden=true;
    }catch(e){ const m=aiErrorText(e); live.className='ai-live err'; live.textContent=m; live.hidden=!m; }
    finally{ ctl=null; stop.style.display='none'; btn.disabled=!aiAvailable() || hints.length>=4; btn.textContent= hints.length>=4?'4 indices donnés':(hints.length?'Un autre indice':'Un indice'); }
  });
  return el('div',{class:'ai-panel'}, list, live, el('div',{class:'row'}, btn, stop));
}

/* ---- 2. Check my setup ---- */
export function verifyBox(p, pad){
  if(!aiAvailable() || !S.aiImg) return null;
  const live=el('div',{class:'ai-live',hidden:true});
  let ctl=null; const stop=stopBtn(()=>ctl);
  const btn=el('button',{class:'btn ai',type:'button',text:'Vérifier ma mise en place'});
  btn.addEventListener('click', async ()=>{
    if(pad.isEmpty()){ toast('Écris d’abord ta mise en place dans le brouillon.','err'); return; }
    btn.disabled=true; stop.style.display=''; live.hidden=false; live.className='ai-live thinking'; live.textContent='Claude lit ton brouillon…';
    ctl=new AbortController();
    try{
      const im=await problemImages(p,true);
      const work=await pad.toBlob();
      const quick=S.settings.reviewMode==='quick';
      const prompt=['Tu es assistant de TP pour un étudiant de 1re année de physique à l’Université de Genève. Il refait un exercice qu’il avait raté et vient d’écrire au stylet '+(quick?'sa mise en place et sa première étape (pas la résolution complète)':'sa résolution')+'.',
        problemContext(p), imgNote(im.labels,['son brouillon manuscrit']),
        'Évalue uniquement ce qu’il a écrit, sans donner le résultat final. Réponds avec exactement ces trois lignes :\nCe qui est juste : …\nÀ corriger : … (ou « rien »)\nProchaine étape : … (une piste, pas la réponse)',
        'Sois bref (6 lignes maximum en tout). Si l’écriture est illisible, dis-le simplement. '+STYLE_RULES].filter(Boolean).join('\n\n');
      const {text}=await S.ai(prompt,{signal:ctl.signal, cache:false, images:im.blobs.concat([work]), onText:({text})=>{ live.className='ai-live'; live.textContent=text; }});
      live.className='ai-live'; live.replaceChildren(mathText(text,'ai-text'));
    }catch(e){ const m=aiErrorText(e); live.className='ai-live err'; live.textContent=(e&&e.text?e.text+'\n':'')+m; live.hidden=!(m||e&&e.text); }
    finally{ ctl=null; stop.style.display='none'; btn.disabled=!aiAvailable(); }
  });
  return el('div',{class:'ai-panel'}, el('div',{class:'row'}, btn, stop), live);
}

/* ---- 3. Revision sheet ---- */
export function sheetButton(ex){
  if(!aiAvailable() && !ex.sheet) return null;
  return el('button',{class:'btn ai',type:'button',text: ex.sheet?'Fiche de révision':'Créer la fiche de révision',onclick:()=>openSheet(ex.id, !ex.sheet)});
}
export function openSheet(exId, generate){
  const ex=(S.settings.exams||[]).find(e=>e.id===exId); if(!ex) return;
  let close; const body=el('div',{class:'fiche'});
  const live=el('div',{class:'ai-live',hidden:true});
  let ctl=null; const stop=stopBtn(()=>ctl);
  const regen=el('button',{class:'btn ai small',type:'button',text:'Régénérer',onclick:()=>gen()});
  const copy=el('button',{class:'btn small',type:'button',text:'Copier le texte',onclick:async()=>{ try{ await navigator.clipboard.writeText(sheetText(ex)); toast('Fiche copiée'); }catch(e){ toast('Copie impossible ici.','err'); } }});
  function draw(){
    body.replaceChildren();
    const d=ex.sheet&&ex.sheet.data; if(!d) return;
    const sec=(title, has, kids)=> has ? el('section',{}, el('h3',{text:title}), kids) : null;
    body.append(...[
      sec('Formules essentielles', (d.formules||[]).length, (d.formules||[]).map(f=>el('div',{class:'f-row'}, el('div',{class:'f-name',text:String(f.nom||'')}), mathText('$'+String(f.formule||'').replace(/\$/g,'')+'$','f-math'), el('div',{class:'f-when muted small',text:String(f.quand||'')})))),
      sec('Tes pièges', (d.pieges||[]).length, el('ul',{}, (d.pieges||[]).map(x=>el('li',{text:String(x)})))),
      sec('Méthode', (d.methode||[]).length, el('ol',{}, (d.methode||[]).map(x=>el('li',{text:String(x)})))),
      sec('À refaire en priorité', (d.a_refaire||[]).length, el('ul',{}, (d.a_refaire||[]).map(x=>el('li',{text:String(x)})))),
      el('p',{class:'muted small',text:'Générée le '+fmtDate(ex.sheet.at)+' par Claude, à partir de tes erreurs. Vérifie les formules avec ton cours.'})].filter(Boolean));
  }
  async function gen(){
    if(!aiAvailable()){ toast('Claude n’est pas disponible ici.','err'); return; }
    regen.disabled=true; stop.style.display=''; live.hidden=false; live.className='ai-live thinking'; live.textContent='Claude prépare ta fiche… (ça peut prendre une minute)';
    ctl=new AbortController();
    const ps=activeProblems().filter(p=>examMatches(ex,p));
    const rc={}; ps.forEach(p=>(p.reasons||[]).forEach(r=>rc[r]=(rc[r]||0)+1));
    const lines=ps.slice(0,40).map(p=>{ const h=p.history||[]; const ag=h.filter(x=>x.r==='again').length;
      return '- thèmes: '+(topicsOf(p).join(', ')||'?')+' | raté car: '+((p.reasons||[]).map(r=>REASON_LABEL[r]).join(', ')||'?')+(p.noteText?' | note: '+p.noteText:'')+(p.problemText?' | énoncé: '+p.problemText.slice(0,300):'')+' | revu '+h.length+' fois, '+ag+'× à revoir'; });
    const prompt=['Crée une fiche de révision d’une page pour le contrôle « '+ex.name+' » ('+ex.course+', le '+fmtDate(ex.date)+') d’un étudiant de 1re année de physique à l’Université de Genève.',
      'Thèmes au programme : '+((ex.topics&&ex.topics.length)?ex.topics.join(', '):'tout le cours ('+topicsFor(ex.course).join(', ')+')'),
      ps.length?'Problèmes qu’il a ratés sur ces thèmes :\n'+lines.join('\n'):'Il n’a pas encore enregistré de problème raté sur ces thèmes.',
      Object.keys(rc).length?'Ses raisons d’erreur, de la plus fréquente à la moins fréquente : '+Object.entries(rc).sort((a,b)=>b[1]-a[1]).map(([r,n])=>REASON_LABEL[r]+' ('+n+')').join(', '):'',
      'Réponds avec uniquement un objet JSON de cette forme :\n{"formules":[{"nom":"…","formule":"LaTeX sans $","quand":"quand l’utiliser, une phrase"}],"pieges":["…"],"methode":["…"],"a_refaire":["…"]}',
      'Contenu : 6 à 12 formules essentielles des thèmes au programme ; 3 à 6 pièges à éviter, personnalisés d’après ses erreurs quand c’est possible ; 4 à 6 étapes d’une méthode générale pour ce type d’exercice ; 2 à 4 types d’exercices à refaire en priorité. Tout en français, phrases courtes, tutoiement.'].filter(Boolean).join('\n\n');
    try{
      const data=await S.ai.json(prompt,{signal:ctl.signal, cache:false, onText:()=>{ live.textContent='Claude écrit ta fiche…'; }});
      if(!data || typeof data!=='object') throw {code:'invalid_json'};
      ex.sheet={data, at:today()}; await saveSettings(); live.hidden=true; draw();
    }catch(e){ const m=aiErrorText(e); live.className='ai-live err'; live.textContent=m; live.hidden=!m; }
    finally{ ctl=null; stop.style.display='none'; regen.disabled=!aiAvailable(); }
  }
  const box=el('div',{},
    el('div',{class:'row'}, el('h2',{text:'Fiche · '+ex.name,style:{marginBottom:0}}), el('span',{class:'spacer'}), el('button',{class:'btn small ghost',text:'Fermer',onclick:()=>close()})),
    el('div',{class:'muted small',style:{margin:'4px 0 14px'},text:ex.course+' · '+fmtDate(ex.date)}),
    live, body,
    el('div',{class:'row',style:{marginTop:'16px'}}, aiAvailable()?regen:null, stop, copy));
  close=modal(box); draw();
  if(generate) gen();
}
export function sheetText(ex){
  const d=ex.sheet&&ex.sheet.data; if(!d) return '';
  const L=['Fiche de révision : '+ex.name+' ('+ex.course+')',''];
  if(d.formules&&d.formules.length){ L.push('FORMULES'); d.formules.forEach(f=>L.push('- '+f.nom+' : '+f.formule+(f.quand?' ('+f.quand+')':''))); L.push(''); }
  if(d.pieges&&d.pieges.length){ L.push('PIÈGES'); d.pieges.forEach(x=>L.push('- '+x)); L.push(''); }
  if(d.methode&&d.methode.length){ L.push('MÉTHODE'); d.methode.forEach((x,i)=>L.push((i+1)+'. '+x)); L.push(''); }
  if(d.a_refaire&&d.a_refaire.length){ L.push('À REFAIRE'); d.a_refaire.forEach(x=>L.push('- '+x)); }
  return L.join('\n');
}

