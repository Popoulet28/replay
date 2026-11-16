import katex from 'katex';
import { el } from '../core/helpers.js';

/* ---------- Formules : KaTeX embarqué (fonctionne hors ligne) ---------- */
const KATEX_OPT = { throwOnError: false, strict: false };

/* Découpe un texte en morceaux {math, text, display} selon $$…$$, $…$ et \(…\). */
export function splitMath(str){
  const out=[]; const re=/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g; let last=0, m;
  while((m=re.exec(str))){
    if(m.index>last) out.push({math:false, text:str.slice(last,m.index)});
    out.push({math:true, display:m[1]!=null, text:m[1]!=null?m[1]:(m[2]!=null?m[2]:m[3])});
    last=re.lastIndex;
  }
  if(last<str.length) out.push({math:false, text:str.slice(last)});
  return out;
}
export function mathText(str, cls){
  const n = el('div',{class:cls||'ptext'});
  for(const part of splitMath(String(str==null?'':str))){
    if(!part.math){ n.append(document.createTextNode(part.text)); continue; }
    const span=document.createElement('span');
    try{ katex.render(part.text, span, Object.assign({displayMode:part.display}, KATEX_OPT)); }
    catch(e){ span.textContent=part.text; }
    n.append(span);
  }
  return n;
}
