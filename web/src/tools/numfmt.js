/* Mise en forme des nombres avec incertitude : module sans dépendance. */
export function fmtVU(v,u){
  if(!isFinite(v)) return {txt:String(v),tex:String(v)};
  let k=0; const av=Math.abs(v)||Math.abs(u)||1;
  if(av>=1e4||av<1e-3) k=Math.floor(Math.log10(av));
  const sv=v/Math.pow(10,k), su=u/Math.pow(10,k);
  if(!(su>0)){ const t=sv.toPrecision(4); return {txt:t+(k?' × 10^'+k:''), tex:t+(k?' \\times 10^{'+k+'}':''), dec:null}; }
  const e=Math.floor(Math.log10(su)); const dec=Math.max(0,1-e);
  let vs, us;
  if(e>=2){ const q=Math.pow(10,e-1); vs=String(Math.round(sv/q)*q); us=String(Math.round(su/q)*q); }
  else { vs=sv.toFixed(dec); us=su.toFixed(dec); }
  return {txt:'('+vs+' ± '+us+')'+(k?' × 10^'+k:''), tex:'('+vs+' \\pm '+us+')'+(k?' \\times 10^{'+k+'}':''), v:vs, u:us};
}
export const parseNum = s => { const t=String(s).trim().replace(',','.'); return t===''?NaN:Number(t); };
