import { el } from '../core/helpers.js';
import { recompress } from '../core/images.js';
import { S } from '../core/state.js';

/* ---------- reusable components ---------- */
export function Chips(options, selected, {multi=false, onchange, extra}={}){
  const box=el('div',{class:'chips'}); let sel = multi ? new Set(selected||[]) : selected;
  function draw(){
    box.replaceChildren(...options.map(o=>{
      const id=typeof o==='string'?o:o.id, label=typeof o==='string'?o:o.label;
      const on = multi ? sel.has(id) : sel===id;
      return el('button',{type:'button',class:'chip'+(on?' on':''), text:label, onclick:()=>{
        if (multi){ sel.has(id)?sel.delete(id):sel.add(id); } else sel = (sel===id?null:id);
        draw(); onchange && onchange(multi?[...sel]:sel);
      }});
    }), extra||[]);
  }
  draw(); return {el:box, get:()=> multi?[...sel]:sel, set:v=>{ sel = multi?new Set(v):v; draw(); }};
}
export function PhotoField(){
  let blob=null, url=null;
  const preview=el('div',{class:'photo-preview'});
  const inCam=el('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'}});
  const inPick=el('input',{type:'file',accept:'image/*',style:{display:'none'}});
  async function take(f){
    if (!f) return;
    preview.replaceChildren(el('div',{class:'muted small',text:'Préparation de l’image…', style:{marginTop:'10px'}}));
    try{ blob = await recompress(f, 2000, 0.85, 'image/jpeg'); }catch(e){ blob = f; }
    if (url) URL.revokeObjectURL(url); url=URL.createObjectURL(blob);
    preview.replaceChildren(el('img',{src:url}),
      el('div',{class:'row',style:{marginTop:'8px'}}, el('button',{type:'button',class:'btn small ghost',text:'Retirer la photo',onclick:()=>{ blob=null; preview.replaceChildren(); }})));
  }
  inCam.addEventListener('change',()=>{ take(inCam.files[0]); inCam.value=''; });
  inPick.addEventListener('change',()=>{ take(inPick.files[0]); inPick.value=''; });
  const root=el('div',{},
    el('div',{class:'photo-btns'},
      el('button',{type:'button',class:'btn',onclick:()=>inCam.click()},'📷 Prendre une photo'),
      el('button',{type:'button',class:'btn',onclick:()=>inPick.click()},'🖼 Capture / galerie')),
    inCam, inPick, preview);
  return {el:root, get:()=>blob, has:()=>!!blob, take, clear:()=>{blob=null;preview.replaceChildren();}};
}
export function InkPad({height=220, hint='Écris avec ton stylet…'}={}){
  const wrap=el('div',{class:'ink'}); const canvas=el('canvas'); const ph=el('div',{class:'ink-hint',text:hint});
  wrap.append(canvas, ph);
  const ctx=canvas.getContext('2d'); const strokes=[]; let cur=null, activeId=null, penSeen=false, color='#1d2fa0';
  let W=0, H=height, dpr=1;
  const width = p => 2.3*(0.35 + (p||0.5)*1.3);
  function paper(){ ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#dbe3f3'; ctx.lineWidth=1; for(let y=34;y<H;y+=34){ ctx.beginPath(); ctx.moveTo(0,y+.5); ctx.lineTo(W,y+.5); ctx.stroke(); } }
  function seg(a,b,c){ ctx.strokeStyle=c; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=width((a[2]+b[2])/2); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
  function dotAt(a,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(a[0],a[1],width(a[2])/2,0,Math.PI*2); ctx.fill(); }
  function drawStroke(s){ if(s.pts.length===1) dotAt(s.pts[0],s.color); for(let i=1;i<s.pts.length;i++) seg(s.pts[i-1],s.pts[i],s.color); }
  function redraw(){ paper(); strokes.forEach(drawStroke); ph.style.display=strokes.length?'none':''; }
  function size(){ const w=wrap.clientWidth; if(!w || w===W) return; W=w; dpr=window.devicePixelRatio||1;
    canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr); canvas.style.width=W+'px'; canvas.style.height=H+'px'; redraw(); }
  if (window.ResizeObserver) new ResizeObserver(size).observe(wrap); requestAnimationFrame(size);
  const pos = e => { const r=canvas.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top, e.pressure||0.5]; };
  canvas.addEventListener('pointerdown', e=>{
    if (e.pointerType==='pen') penSeen=true;
    if (S.settings.penOnly && penSeen && e.pointerType==='touch') return;
    if (activeId!==null) return;
    activeId=e.pointerId; try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    cur={color, pts:[pos(e)]}; strokes.push(cur); dotAt(cur.pts[0],color); ph.style.display='none'; e.preventDefault();
  });
  canvas.addEventListener('pointermove', e=>{
    if (e.pointerId!==activeId || !cur) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (const ev of evs){ const p=pos(ev); const last=cur.pts[cur.pts.length-1]; if(Math.abs(p[0]-last[0])+Math.abs(p[1]-last[1])<0.6) continue; cur.pts.push(p); seg(last,p,cur.color); }
    e.preventDefault();
  });
  const end = e=>{ if(e.pointerId!==activeId) return; activeId=null; cur=null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  const sw = [];
  const tools=el('div',{class:'ink-tools'},
    ...[['#1d2fa0','Bleu'],['#16182a','Noir'],['#d3302f','Rouge'],['#1d8a4e','Vert']].map(([c,n])=>{ const b=el('button',{type:'button',class:'swatch'+(c===color?' on':''),title:n,style:{background:c},onclick:()=>{ color=c; sw.forEach(x=>x.classList.toggle('on',x===b)); }}); sw.push(b); return b; }),
    el('span',{class:'spacer'}),
    el('button',{type:'button',class:'btn small',text:'↶ Annuler le trait',onclick:()=>{ strokes.pop(); redraw(); }}),
    el('button',{type:'button',class:'btn small ghost',text:'Effacer',onclick:()=>{ strokes.length=0; redraw(); }}));
  const root=el('div',{}, wrap, tools);
  return {el:root, isEmpty:()=>!strokes.length,
    toBlob:()=>new Promise(r=>canvas.toBlob(r,'image/png')),
    clear:()=>{ strokes.length=0; redraw(); }};
}

