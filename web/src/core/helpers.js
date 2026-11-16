/* ---------- helpers ---------- */
export function el(tag, props, ...kids){
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(props||{})){
    if (v==null || v===false) continue;
    if (k==='class') n.className = v;
    else if (k==='text') n.textContent = v;
    else if (k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2), v);
    else if (k==='style' && typeof v==='object') Object.assign(n.style, v);
    else if (v===true) n.setAttribute(k,'');
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)){
    if (c==null || c===false) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
export const pl=(n,w)=>n+' '+w+(n===1?'':'s');
export const clone = o => JSON.parse(JSON.stringify(o));
export const sleep = ms => new Promise(r=>setTimeout(r,ms));
export const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
export function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
export function today(){ return ymd(new Date()); }
export function parseYmd(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
export function addDays(s,n){ const d=parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); }
export function diffDays(a,b){ return Math.round((parseYmd(b)-parseYmd(a))/86400000); }
export function fmtInterval(n){ if(n<=1) return 'demain'; if(n<30) return n+' jours'; if(n<60) return '~1 mois'; return '~'+Math.round(n/30)+' mois'; }
export function fmtDue(s){ const d=diffDays(today(),s); if(d<0) return 'en attente'; if(d===0) return 'aujourd’hui'; if(d===1) return 'demain'; return 'dans '+d+' jours'; }
export function fmtDate(s){ return parseYmd(s).toLocaleDateString('fr-CH',{day:'numeric',month:'short'}); }

