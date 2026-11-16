import { el } from '../core/helpers.js';
import { S } from '../core/state.js';
import { fitTool } from './fit.js';
import { uncTool } from './uncertainty.js';
import { unitsTool } from './units.js';
import { render } from '../ui/chrome.js';

/* ---- Tools view ---- */
export function viewTools(){
  const root=el('div'); root.append(el('h2',{text:'Outils'}));
  const tab=S.toolTab||'units';
  const seg=el('div',{class:'seg',style:{marginBottom:'16px'}});
  [['units','Unités'],['unc','Incertitudes'],['fit','Ajustement']].forEach(([id,l])=>seg.append(el('button',{class:tab===id?'on':'',text:l,onclick:()=>{ S.toolTab=id; render(); }})));
  root.append(seg);
  root.append(tab==='units'?unitsTool():tab==='unc'?uncTool():fitTool());
  return root;
}

