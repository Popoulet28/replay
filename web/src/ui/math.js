import { el } from '../core/helpers.js';

/* ---------- MathJax (lazy) ---------- */
export let mjPromise = null;
export function ensureMathJax(){
  if (mjPromise) return mjPromise;
  window.MathJax = { tex:{inlineMath:[['$','$'],['\\(','\\)']]}, svg:{fontCache:'global'}, startup:{typeset:false} };
  mjPromise = new Promise(res=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'; s.async=true; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.append(s); });
  return mjPromise;
}
export function mathText(str, cls){
  const n = el('div',{class:cls||'ptext', text:str});
  if (/\$|\\\(/.test(str)) ensureMathJax().then(ok=>{ if(ok && window.MathJax && MathJax.typesetPromise) MathJax.startup.promise.then(()=>MathJax.typesetPromise([n])).catch(()=>{}); });
  return n;
}

