// Visualisations interactives (canvas) — chaque entrée de VIZ monte un widget dans un élément
const VIZ = {};
let VIZ_ACTIVE = [];
function vizCleanup() { VIZ_ACTIVE.forEach(w => w.stop && w.stop()); VIZ_ACTIVE = []; }
window.addEventListener('resize', () => VIZ_ACTIVE.forEach(w => w.redraw(true)));

function pal(el) {
  const cs = getComputedStyle(el), g = n => cs.getPropertyValue(n).trim();
  return { text: g('--text'), muted: g('--muted'), grid: g('--border'), bg: g('--panel'), a: g('--c') || '#4c6ef5', b: '#f08c00', g: '#2f9e44', r: '#e03131', p: '#9c36b5' };
}
function nice(range) { const raw = range / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
const f2 = (x, d = 2) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(d).replace('.', ',');

class G {
  constructor(ctx, W, H, C) { this.ctx = ctx; this.W = W; this.H = H; this.C = C; this.view(0, 1, 0, 1); }
  view(x0, x1, y0, y1, pad) {
    this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1;
    this.pl = pad && pad.l != null ? pad.l : 38; this.pr = pad && pad.r != null ? pad.r : 14; this.pt = pad && pad.t != null ? pad.t : 14; this.pb = pad && pad.b != null ? pad.b : 26;
    if (pad && pad.square) { // même échelle en x et y
      const w = this.W - this.pl - this.pr, h = this.H - this.pt - this.pb, s = Math.min(w / (x1 - x0), h / (y1 - y0));
      const ex = (w / s - (x1 - x0)) / 2, ey = (h / s - (y1 - y0)) / 2;
      this.x0 -= ex; this.x1 += ex; this.y0 -= ey; this.y1 += ey;
    }
    return this;
  }
  X(x) { return this.pl + (x - this.x0) / (this.x1 - this.x0) * (this.W - this.pl - this.pr); }
  Y(y) { return this.H - this.pb - (y - this.y0) / (this.y1 - this.y0) * (this.H - this.pt - this.pb); }
  ix(px) { return this.x0 + (px - this.pl) / (this.W - this.pl - this.pr) * (this.x1 - this.x0); }
  iy(py) { return this.y0 + (this.H - this.pb - py) / (this.H - this.pt - this.pb) * (this.y1 - this.y0); }
  axes(xl, yl, o) {
    o = o || {};
    const c = this.ctx, C = this.C;
    c.font = '11px Segoe UI, sans-serif'; c.lineWidth = 1;
    const ay = (this.y0 <= 0 && this.y1 >= 0) ? 0 : this.y0, ax = (this.x0 <= 0 && this.x1 >= 0) ? 0 : this.x0;
    if (!o.noticks) {
      const sx = nice(this.x1 - this.x0), sy = nice(this.y1 - this.y0);
      c.fillStyle = C.muted; c.strokeStyle = C.grid;
      for (let x = Math.ceil(this.x0 / sx) * sx; x <= this.x1 + 1e-9; x += sx) {
        c.beginPath(); c.moveTo(this.X(x), this.Y(this.y0)); c.lineTo(this.X(x), this.Y(this.y1)); c.globalAlpha = .5; c.stroke(); c.globalAlpha = 1;
        if (Math.abs(x) > 1e-9 || ax !== 0) { c.textAlign = 'center'; c.fillText(+x.toFixed(6), this.X(x), this.Y(ay) + 13); }
      }
      for (let y = Math.ceil(this.y0 / sy) * sy; y <= this.y1 + 1e-9; y += sy) {
        c.beginPath(); c.moveTo(this.X(this.x0), this.Y(y)); c.lineTo(this.X(this.x1), this.Y(y)); c.globalAlpha = .5; c.stroke(); c.globalAlpha = 1;
        if (Math.abs(y) > 1e-9) { c.textAlign = 'right'; c.fillText(+y.toFixed(6), this.X(ax) - 5, this.Y(y) + 4); }
      }
    }
    c.strokeStyle = C.muted; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(this.X(this.x0), this.Y(ay)); c.lineTo(this.X(this.x1), this.Y(ay)); c.moveTo(this.X(ax), this.Y(this.y0)); c.lineTo(this.X(ax), this.Y(this.y1)); c.stroke();
    c.fillStyle = C.text; c.font = 'italic 12px Segoe UI, sans-serif';
    if (xl) { c.textAlign = 'right'; c.fillText(xl, this.X(this.x1) - 2, this.Y(ay) - 6); }
    if (yl) { c.textAlign = 'left'; c.fillText(yl, this.X(ax) + 6, this.Y(this.y1) + 10); }
  }
  path(pts, col, w, dash) {
    const c = this.ctx; c.strokeStyle = col; c.lineWidth = w || 2; c.setLineDash(dash || []); c.lineJoin = 'round'; c.beginPath();
    let pen = false;
    for (const p of pts) {
      if (p == null || !isFinite(p[1])) { pen = false; continue; }
      const X = this.X(p[0]), Y = this.Y(p[1]);
      if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; }
    }
    c.stroke(); c.setLineDash([]);
  }
  fn(f, col, w, dash, a, b) {
    a = a == null ? this.x0 : a; b = b == null ? this.x1 : b;
    const pts = [], n = 300, lo = this.y0 - (this.y1 - this.y0) * 2, hi = this.y1 + (this.y1 - this.y0) * 2;
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n, y = f(x); pts.push(isFinite(y) && y > lo && y < hi ? [x, y] : null); }
    const c = this.ctx; c.save(); c.beginPath(); c.rect(this.pl, this.pt, this.W - this.pl - this.pr, this.H - this.pt - this.pb); c.clip();
    this.path(pts, col, w, dash); c.restore();
  }
  seg(x1, y1, x2, y2, col, w, dash) { this.path([[x1, y1], [x2, y2]], col, w || 1.5, dash); }
  dot(x, y, col, r) { const c = this.ctx; c.fillStyle = col; c.beginPath(); c.arc(this.X(x), this.Y(y), r || 4.5, 0, 7); c.fill(); c.strokeStyle = this.C.bg; c.lineWidth = 1.5; c.stroke(); }
  txt(s, x, y, col, align, dx, dy, bold) { const c = this.ctx; c.fillStyle = col || this.C.text; c.font = (bold ? '600 ' : '') + '12px Segoe UI, sans-serif'; c.textAlign = align || 'left'; c.fillText(s, this.X(x) + (dx || 0), this.Y(y) + (dy || 0)); }
  poly(pts, fill, alpha, stroke, w) {
    const c = this.ctx; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))); c.closePath();
    if (fill) { c.globalAlpha = alpha == null ? .2 : alpha; c.fillStyle = fill; c.fill(); c.globalAlpha = 1; }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = w || 1; c.stroke(); }
  }
  arrow(x1, y1, x2, y2, col, w) {
    const c = this.ctx, X1 = this.X(x1), Y1 = this.Y(y1), X2 = this.X(x2), Y2 = this.Y(y2), a = Math.atan2(Y2 - Y1, X2 - X1), L = Math.hypot(X2 - X1, Y2 - Y1);
    if (L < 1) return;
    const h = Math.min(8, L * .45);
    c.strokeStyle = c.fillStyle = col; c.lineWidth = w || 2; c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2 - Math.cos(a) * h * .6, Y2 - Math.sin(a) * h * .6); c.stroke();
    c.beginPath(); c.moveTo(X2, Y2); c.lineTo(X2 - h * Math.cos(a - .42), Y2 - h * Math.sin(a - .42)); c.lineTo(X2 - h * Math.cos(a + .42), Y2 - h * Math.sin(a + .42)); c.closePath(); c.fill();
  }
  circle(x, y, r, col, w, fill, alpha) { const c = this.ctx; c.beginPath(); c.ellipse(this.X(x), this.Y(y), Math.abs(this.X(x + r) - this.X(x)), Math.abs(this.Y(y + r) - this.Y(y)), 0, 0, 7); if (fill) { c.globalAlpha = alpha || .15; c.fillStyle = fill; c.fill(); c.globalAlpha = 1; } if (col) { c.strokeStyle = col; c.lineWidth = w || 1.5; c.stroke(); } }
}

function widget(el, o) {
  el.innerHTML = '<div class="viz-head"><b>' + o.title + '</b>' + (o.hint ? '<span>' + o.hint + '</span>' : '') + '</div><canvas></canvas><div class="viz-extra"></div><div class="viz-ctl"></div><div class="viz-info"></div>';
  const cv = el.querySelector('canvas'), ctl = el.querySelector('.viz-ctl'), info = el.querySelector('.viz-info');
  const v = {}, api = { el, v, extra: el.querySelector('.viz-extra') };
  if (o.noCanvas) cv.style.display = 'none';
  (o.sliders || []).forEach(s => {
    v[s.id] = s.val;
    const lab = document.createElement('label');
    lab.innerHTML = '<span>' + s.label + '</span><input type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.val + '"><output></output>';
    const inp = lab.querySelector('input'), out = lab.querySelector('output');
    s.set = x => { v[s.id] = x; inp.value = x; out.textContent = s.fmt ? s.fmt(x) : f2(x, s.step < .1 ? 2 : s.step < 1 ? 1 : 0); };
    inp.oninput = () => { s.set(+inp.value); api.redraw(); };
    s.set(s.val); ctl.appendChild(lab);
  });
  (o.selects || []).forEach(s => {
    v[s.id] = s.options[0][0];
    const lab = document.createElement('label');
    lab.innerHTML = '<span>' + s.label + '</span><select>' + s.options.map(op => '<option value="' + op[0] + '">' + op[1] + '</option>').join('') + '</select>';
    lab.querySelector('select').onchange = e => { v[s.id] = e.target.value; api.redraw(); };
    ctl.appendChild(lab);
  });
  (o.buttons || []).forEach(b => {
    const bt = document.createElement('button'); bt.className = 'btn small'; bt.textContent = b.label;
    bt.onclick = () => { b.on(v, api, bt); api.redraw(); }; ctl.appendChild(bt);
  });
  api.slider = id => o.sliders.find(s => s.id === id);
  let g = null, lastW = 0, raf = 0;
  function size() {
    const dpr = window.devicePixelRatio || 1, W = Math.max(280, Math.min(el.clientWidth - 2, o.maxW || 760)), H = o.h || 280;
    lastW = el.clientWidth; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); g = new G(ctx, W, H, pal(el));
  }
  api.redraw = force => {
    if (!el.isConnected) return;
    if (!o.noCanvas) { if (!g || force || el.clientWidth !== lastW) size(); g.C = pal(el); g.ctx.clearRect(0, 0, g.W, g.H); o.draw(g, v, api); }
    if (o.info) info.innerHTML = o.info(v, api);
    if (o.after) o.after(v, api);
  };
  api.play = step => { // boucle d'animation ; step(dt) renvoie false pour s'arrêter
    cancelAnimationFrame(raf); let t0 = performance.now();
    const loop = t => { if (!el.isConnected) return; const dt = Math.min(.05, (t - t0) / 1000); t0 = t; const go = step(dt); api.redraw(); if (go !== false) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  };
  api.stop = () => cancelAnimationFrame(raf);
  if (o.drag) {
    let down = false;
    const h = (e, ph) => { const r = cv.getBoundingClientRect(); o.drag(v, g.ix(e.clientX - r.left), g.iy(e.clientY - r.top), ph); api.redraw(); };
    cv.style.cursor = 'grab'; cv.style.touchAction = 'none';
    cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); h(e, 'down'); };
    cv.onpointermove = e => { if (down) h(e, 'move'); };
    cv.onpointerup = () => { down = false; };
  }
  VIZ_ACTIVE.push(api);
  if (o.init) o.init(v, api);
  api.redraw();
  return api;
}
const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const simpson = (f, a, b, n = 400) => { let s = f(a) + f(b); const h = (b - a) / n; for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };

/* ---------- Méthodes mathématiques / Analyse ---------- */
VIZ.complexe = el => widget(el, {
  title: 'Le plan complexe', hint: 'Glisse le point z', h: 320,
  init: v => { v.x = 2; v.y = 1.5; },
  drag: (v, x, y) => { v.x = Math.max(-3.4, Math.min(3.4, x)); v.y = Math.max(-2.6, Math.min(2.6, y)); },
  draw: (g, v) => {
    g.view(-3.5, 3.5, -2.7, 2.7, { square: true }); g.axes('Re', 'Im');
    const C = g.C, r = Math.hypot(v.x, v.y), ph = Math.atan2(v.y, v.x);
    g.circle(0, 0, r, C.grid, 1);
    const arc = []; for (let i = 0; i <= 30; i++) arc.push([.6 * Math.cos(ph * i / 30), .6 * Math.sin(ph * i / 30)]);
    g.path(arc, C.b, 2); g.txt('φ', .8 * Math.cos(ph / 2), .8 * Math.sin(ph / 2), C.b, 'center', 0, 4, true);
    g.seg(v.x, 0, v.x, v.y, C.muted, 1, [4, 4]); g.seg(0, v.y, v.x, v.y, C.muted, 1, [4, 4]);
    g.arrow(0, 0, v.x, v.y, C.a, 2.5); g.arrow(0, 0, v.x, -v.y, C.p, 1.5);
    g.dot(v.x, v.y, C.a, 6); g.dot(v.x, -v.y, C.p, 4);
    g.txt('z', v.x, v.y, C.a, 'left', 9, -8, true); g.txt('z̄ (conjugué)', v.x, -v.y, C.p, 'left', 9, 14);
    g.txt('ρ', v.x / 2, v.y / 2, C.a, 'right', -6, -6, true);
  },
  info: v => { const r = Math.hypot(v.x, v.y), ph = Math.atan2(v.y, v.x); return '<b>z = ' + f2(v.x) + (v.y < 0 ? ' − ' : ' + ') + f2(Math.abs(v.y)) + ' i</b> &nbsp;·&nbsp; module ρ = ' + f2(r) + ' &nbsp;·&nbsp; argument φ = ' + f2(ph) + ' rad (' + f2(ph * 180 / Math.PI, 0) + '°) &nbsp;·&nbsp; z·z̄ = ' + f2(r * r); }
});

VIZ.fonctions = el => {
  const dia = (title, A, B, map, col) => {
    const ya = i => 30 + i * (120 / Math.max(1, A - 1)) * (A > 1 ? 1 : 0) + (A === 1 ? 60 : 0), yb = i => 30 + i * (120 / Math.max(1, B - 1));
    let s = '<svg viewBox="0 0 200 200" class="fsvg"><ellipse cx="48" cy="90" rx="30" ry="78" class="set"/><ellipse cx="152" cy="90" rx="30" ry="78" class="set"/>';
    const hit = new Set(map);
    map.forEach((b, a) => { s += '<line x1="54" y1="' + ya(a) + '" x2="143" y2="' + yb(b) + '" stroke="' + col + '" stroke-width="2" marker-end="url(#ah' + col.slice(1) + ')"/>'; });
    for (let i = 0; i < A; i++) s += '<circle cx="48" cy="' + ya(i) + '" r="5" class="pt"/>';
    for (let i = 0; i < B; i++) s += '<circle cx="152" cy="' + yb(i) + '" r="5" class="' + (hit.has(i) ? 'pt' : 'pt miss') + '"/>';
    s += '<defs><marker id="ah' + col.slice(1) + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="' + col + '"/></marker></defs>';
    s += '<text x="48" y="186" text-anchor="middle" class="lab">A</text><text x="152" y="186" text-anchor="middle" class="lab">B</text></svg><div class="fcap">' + title + '</div>';
    return '<div>' + s + '</div>';
  };
  el.innerHTML = '<div class="viz-head"><b>Injective, surjective, bijective</b><span>Regarde les flèches</span></div><div class="fgrid">' +
    dia('<b>Injective</b>, pas surjective<br><small>jamais deux flèches sur le même point ; un point de B n\'est pas atteint (en rouge)</small>', 3, 4, [0, 1, 3], '#2f9e44') +
    dia('<b>Surjective</b>, pas injective<br><small>tout B est atteint, mais deux points ont la même image</small>', 4, 3, [0, 0, 1, 2], '#f08c00') +
    dia('<b>Bijective</b><br><small>chaque point de B est atteint exactement une fois : l\'inverse existe</small>', 3, 3, [1, 0, 2], '#4c6ef5') + '</div>';
};

VIZ.tangente = el => {
  const f = x => Math.sin(x) + .25 * x, df = x => Math.cos(x) + .25;
  return widget(el, {
    title: 'De la sécante à la tangente', hint: 'Fais tendre ε vers 0',
    sliders: [{ id: 'x0', label: 'x₀', min: 0, max: 5, step: .05, val: 1.2 }, { id: 'e', label: 'ε', min: .01, max: 2.5, step: .01, val: 1.8 }],
    draw: (g, v) => {
      g.view(-.5, 7, -1, 3.2); g.axes('x', 'f(x)');
      const C = g.C, x0 = v.x0, x1 = x0 + v.e, s = (f(x1) - f(x0)) / v.e;
      g.fn(f, C.a, 2.5);
      g.fn(x => f(x0) + df(x0) * (x - x0), C.g, 1.5, [6, 4]);
      g.fn(x => f(x0) + s * (x - x0), C.b, 2);
      g.seg(x0, f(x0), x1, f(x0), C.muted, 1, [3, 3]); g.seg(x1, f(x0), x1, f(x1), C.muted, 1, [3, 3]);
      g.dot(x0, f(x0), C.a); g.dot(x1, f(x1), C.b);
      g.txt('x₀', x0, f(x0), C.text, 'center', 0, 18); g.txt('x₀+ε', x1, f(x1), C.b, 'left', 8, -6);
    },
    info: v => { const s = (f(v.x0 + v.e) - f(v.x0)) / v.e; return '<span style="color:#f08c00">■</span> pente de la sécante = <b>' + f2(s, 3) + '</b> &nbsp;·&nbsp; <span style="color:#2f9e44">■</span> pente de la tangente f′(x₀) = <b>' + f2(df(v.x0), 3) + '</b> &nbsp;·&nbsp; écart = ' + f2(Math.abs(s - df(v.x0)), 3); }
  });
};

VIZ.taylor = el => {
  const F = {
    sin: [Math.sin, k => k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / fact(k) : 0, 'sin x'],
    cos: [Math.cos, k => k % 2 ? 0 : ((k / 2) % 2 ? -1 : 1) / fact(k), 'cos x'],
    exp: [Math.exp, k => 1 / fact(k), 'eˣ'],
    ln: [x => x > -1 ? Math.log(1 + x) : NaN, k => k ? (k % 2 ? 1 : -1) / k : 0, 'ln(1+x)'],
    geo: [x => x < 1 ? 1 / (1 - x) : NaN, () => 1, '1/(1−x)']
  };
  return widget(el, {
    title: 'Polynômes de Taylor en 0', hint: 'Augmente l\'ordre : l\'approximation s\'améliore près de 0',
    selects: [{ id: 'f', label: 'Fonction', options: Object.keys(F).map(k => [k, F[k][2]]) }],
    sliders: [{ id: 'n', label: 'Ordre n', min: 0, max: 12, step: 1, val: 1 }, { id: 'x', label: 'Point x testé', min: -3, max: 3, step: .1, val: 1.5 }],
    draw: (g, v) => {
      g.view(-5, 5, -3, 3.5); g.axes('x', 'y');
      const [f, c] = F[v.f], P = x => { let s = 0; for (let k = 0; k <= v.n; k++) s += c(k) * Math.pow(x, k); return s; };
      g.fn(f, g.C.a, 2.5); g.fn(P, g.C.b, 2);
      if (isFinite(f(v.x))) { g.seg(v.x, f(v.x), v.x, P(v.x), g.C.r, 2); g.dot(v.x, f(v.x), g.C.a); g.dot(v.x, P(v.x), g.C.b); }
      v._err = isFinite(f(v.x)) ? Math.abs(f(v.x) - P(v.x)) : NaN;
      g.txt('f', 4.6, Math.max(-2.6, Math.min(3.1, f(4.6) || 0)), g.C.a, 'left', 0, -6, true);
    },
    info: v => '<span style="color:var(--c)">■</span> ' + F[v.f][2] + ' &nbsp; <span style="color:#f08c00">■</span> polynôme de Taylor d\'ordre ' + v.n + ' &nbsp;·&nbsp; erreur en x = ' + f2(v.x, 1) + ' : <b>' + (isFinite(v._err) ? (v._err < .001 ? v._err.toExponential(1).replace('.', ',') : f2(v._err, 3)) : '—') + '</b>' + ((v.f === 'ln' || v.f === 'geo') ? ' <i>(hors de ]−1, 1[, augmenter n n\'aide pas : le DL est local)</i>' : '')
  });
};

VIZ.champ = el => {
  const F = {
    source: [(x, y) => [x, y], 'Source (x, y)', 2, 0],
    puits: [(x, y) => [-x, -y], 'Puits (−x, −y)', -2, 0],
    tourb: [(x, y) => [-y, x], 'Tourbillon (−y, x)', 0, 2],
    cis: [(x, y) => [y, 0], 'Cisaillement (y, 0)', 0, -1],
    spir: [(x, y) => [x - y, x + y], 'Spirale (x−y, x+y)', 2, 2],
    unif: [() => [1, .5], 'Uniforme (1, ½)', 0, 0]
  };
  return widget(el, {
    title: 'Champs de vecteurs : divergence et rotationnel', h: 320,
    selects: [{ id: 'f', label: 'Champ', options: Object.keys(F).map(k => [k, F[k][1]]) }],
    draw: (g, v) => {
      g.view(-3, 3, -2.3, 2.3, { square: true }); g.axes('x', 'y', { noticks: true });
      const f = F[v.f][0];
      for (let x = -2.5; x <= 2.51; x += .5) for (let y = -2; y <= 2.01; y += .5) { const [a, b] = f(x, y), m = Math.hypot(a, b); if (m < 1e-9) continue; const s = .13 + .1 * Math.min(m, 3); g.arrow(x - a / m * s, y - b / m * s, x + a / m * s, y + b / m * s, g.C.a, 1.6); }
    },
    info: v => { const d = F[v.f][2], r = F[v.f][3]; return '<b>div = ' + d + '</b> ' + (d > 0 ? '(le champ sort : source)' : d < 0 ? '(le champ rentre : puits)' : '(ni source ni puits)') + ' &nbsp;·&nbsp; <b>rot<sub>z</sub> = ' + r + '</b> ' + (r ? '(ça tourne : une petite roue à aubes placée dans le champ tournerait)' : '(pas de tourbillon)'); }
  });
};

VIZ.coords = el => widget(el, {
  title: 'Coordonnées sphériques (r, θ, φ)', hint: 'Bouge θ et φ', h: 320, maxW: 520,
  sliders: [{ id: 't', label: 'θ (depuis z)', min: 5, max: 175, step: 1, val: 50, fmt: x => x + '°' }, { id: 'p', label: 'φ (dans le plan xy)', min: 0, max: 360, step: 1, val: 55, fmt: x => x + '°' }],
  draw: (g, v) => {
    g.view(-1.5, 1.5, -1.1, 1.5, { square: true, l: 8, b: 8 });
    const C = g.C, pr = (x, y, z) => [y - .45 * x, z - .32 * x], L = (a, b, col, w, d) => g.seg(a[0], a[1], b[0], b[1], col, w, d);
    const th = v.t * Math.PI / 180, ph = v.p * Math.PI / 180, r = 1.15, P = [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)];
    const O = pr(0, 0, 0), A = (p, lab) => { const q = pr(...p); g.arrow(O[0], O[1], q[0], q[1], C.muted, 1.3); g.txt(lab, q[0], q[1], C.text, 'left', 5, 0, true); };
    A([1.6, 0, 0], 'x'); A([0, 1.4, 0], 'y'); A([0, 0, 1.4], 'z');
    const Q = pr(P[0], P[1], 0), PP = pr(...P);
    L(O, Q, C.g, 1.5, [5, 4]); L(Q, PP, C.muted, 1, [3, 3]); g.arrow(O[0], O[1], PP[0], PP[1], C.a, 2.5);
    const a1 = [], a2 = []; for (let i = 0; i <= 24; i++) { const t = th * i / 24; a1.push(pr(.4 * Math.sin(t) * Math.cos(ph), .4 * Math.sin(t) * Math.sin(ph), .4 * Math.cos(t))); const p = ph * i / 24; a2.push(pr(.45 * Math.cos(p), .45 * Math.sin(p), 0)); }
    g.path(a1, C.b, 2); g.path(a2, C.p, 2);
    const m1 = a1[12], m2 = a2[12]; g.txt('θ', m1[0], m1[1], C.b, 'center', 8, -4, true); g.txt('φ', m2[0], m2[1], C.p, 'center', 0, 16, true);
    g.dot(PP[0], PP[1], C.a, 6); g.txt('P', PP[0], PP[1], C.a, 'left', 9, -6, true); g.txt('r', (O[0] + PP[0]) / 2, (O[1] + PP[1]) / 2, C.a, 'right', -6, -4, true);
    g.txt('ρ = r sin θ', (O[0] + Q[0]) / 2, (O[1] + Q[1]) / 2, C.g, 'center', 0, 16);
  },
  info: v => { const th = v.t * Math.PI / 180, ph = v.p * Math.PI / 180; return 'Avec r = 1 : x = sin θ cos φ = <b>' + f2(Math.sin(th) * Math.cos(ph)) + '</b>, y = sin θ sin φ = <b>' + f2(Math.sin(th) * Math.sin(ph)) + '</b>, z = cos θ = <b>' + f2(Math.cos(th)) + '</b>. En vert : le rayon cylindrique ρ.'; }
});

VIZ.riemann = el => {
  const f = x => 1.2 + .7 * Math.sin(1.6 * x) + .15 * x, a = 0, b = 4, exact = simpson(f, a, b);
  return widget(el, {
    title: 'Sommes de Riemann', hint: 'Plus n est grand, plus la somme approche l\'intégrale',
    sliders: [{ id: 'n', label: 'n intervalles', min: 1, max: 80, step: 1, val: 6 }],
    selects: [{ id: 'm', label: 'Méthode', options: [['g', 'Rectangles (gauche)'], ['d', 'Rectangles (droite)'], ['m', 'Point milieu'], ['t', 'Trapèzes']] }],
    draw: (g, v) => {
      g.view(-.3, 4.4, 0, 2.6); g.axes('x', 'f(x)');
      const h = (b - a) / v.n; let s = 0;
      for (let i = 0; i < v.n; i++) {
        const x = a + i * h, yl = f(x), yr = f(x + h), ym = f(x + h / 2);
        if (v.m === 't') { g.poly([[x, 0], [x, yl], [x + h, yr], [x + h, 0]], g.C.a, .22, g.C.a); s += (yl + yr) / 2 * h; }
        else { const y = v.m === 'g' ? yl : v.m === 'd' ? yr : ym; g.poly([[x, 0], [x, y], [x + h, y], [x + h, 0]], g.C.a, .22, g.C.a); s += y * h; }
      }
      v._s = s; g.fn(f, g.C.b, 2.5, null, a, b);
      g.txt('a', a, 0, g.C.text, 'center', 0, 15, true); g.txt('b', b, 0, g.C.text, 'center', 0, 15, true);
    },
    info: v => 'Somme = <b>' + f2(v._s, 4) + '</b> &nbsp;·&nbsp; valeur exacte = ' + f2(exact, 4) + ' &nbsp;·&nbsp; erreur = <b>' + f2(Math.abs(v._s - exact), 4) + '</b> ' + (v.m === 't' || v.m === 'm' ? '(décroît comme 1/n²)' : '(décroît comme 1/n)')
  });
};

VIZ.arc = el => {
  const c = t => [(.4 + .28 * t) * Math.cos(t), (.4 + .28 * t) * Math.sin(t)], T = 2 * Math.PI * 1.25;
  const exact = simpson(t => Math.hypot(.28, .4 + .28 * t), 0, T);
  return widget(el, {
    title: 'Longueur d\'une courbe et vecteur tangent', h: 320, maxW: 560,
    sliders: [{ id: 'n', label: 'n segments', min: 2, max: 60, step: 1, val: 5 }, { id: 't', label: 'paramètre t', min: 0, max: T, step: .02, val: 2.2 }],
    draw: (g, v) => {
      g.view(-2.9, 3, -2.6, 2.4, { square: true }); g.axes('', '', { noticks: true });
      const pts = []; for (let i = 0; i <= 200; i++) pts.push(c(T * i / 200)); g.path(pts, g.C.a, 2.5);
      const poly = []; let L = 0; for (let i = 0; i <= v.n; i++) { poly.push(c(T * i / v.n)); if (i) L += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]); }
      g.path(poly, g.C.b, 1.8); poly.forEach(p => g.dot(p[0], p[1], g.C.b, 3)); v._L = L;
      const p = c(v.t), d = .01, q = c(v.t + d), tx = (q[0] - p[0]) / d, ty = (q[1] - p[1]) / d, m = Math.hypot(tx, ty); v._sp = m;
      g.arrow(p[0], p[1], p[0] + tx * .7, p[1] + ty * .7, g.C.g, 2); g.arrow(p[0], p[1], p[0] + tx / m * .7, p[1] + ty / m * .7, g.C.r, 2.5);
      g.dot(p[0], p[1], g.C.text, 5); g.txt("f′(t)", p[0] + tx * .7, p[1] + ty * .7, g.C.g, 'left', 6, -4, true);
    },
    info: v => 'Longueur de la ligne brisée = <b>' + f2(v._L, 3) + '</b> → longueur exacte ∫|f′(t)|dt = <b>' + f2(exact, 3) + '</b> &nbsp;·&nbsp; <span style="color:#2f9e44">■</span> f′(t), vitesse |f′(t)| = ' + f2(v._sp) + ' &nbsp; <span style="color:#e03131">■</span> vecteur unité tangent (norme 1)'
  });
};

VIZ.suite = el => widget(el, {
  title: 'Convergence d\'une suite : uₙ = 1 + (−1)ⁿ/n → 1', hint: 'Réduis ε : il faut aller plus loin (N plus grand)',
  sliders: [{ id: 'e', label: 'ε', min: .02, max: .6, step: .01, val: .3 }],
  draw: (g, v) => {
    g.view(0, 62, .2, 1.8); g.axes('n', 'uₙ');
    const C = g.C, N = Math.floor(1 / v.e) + 1; v._N = N;
    g.poly([[0, 1 - v.e], [62, 1 - v.e], [62, 1 + v.e], [0, 1 + v.e]], C.g, .15);
    g.seg(0, 1, 62, 1, C.g, 1.5, [6, 4]); g.seg(0, 1 + v.e, 62, 1 + v.e, C.g, 1); g.seg(0, 1 - v.e, 62, 1 - v.e, C.g, 1);
    if (N <= 62) { g.seg(N, .2, N, 1.8, C.b, 1.5, [4, 3]); g.txt('N = ' + N, N, 1.8, C.b, 'left', 5, 12, true); }
    for (let n = 1; n <= 60; n++) { const u = 1 + (n % 2 ? -1 : 1) / n; g.dot(n, u, Math.abs(u - 1) < v.e ? (n >= N ? C.g : C.muted) : C.r, 3.2); }
    g.txt('ℓ + ε', 62, 1 + v.e, C.g, 'right', -4, -4); g.txt('ℓ − ε', 62, 1 - v.e, C.g, 'right', -4, 13);
  },
  info: v => 'Pour ε = ' + f2(v.e) + ', à partir du rang <b>N = ' + v._N + '</b> tous les termes sont dans la bande verte : |uₙ − 1| &lt; ε pour tout n ≥ N. C\'est exactement la définition de la convergence.'
});

VIZ.epsdelta = el => widget(el, {
  title: 'Continuité en ε–δ : f(x) = x²', hint: 'Pour chaque ε, on trouve un δ. Remarque : δ rétrécit quand a grandit',
  sliders: [{ id: 'a', label: 'point a', min: .3, max: 2.4, step: .05, val: 1 }, { id: 'e', label: 'ε', min: .05, max: 1.5, step: .05, val: .8 }],
  draw: (g, v) => {
    g.view(-.3, 3.2, -.5, 8); g.axes('x', 'f(x)');
    const C = g.C, fa = v.a * v.a, d = Math.sqrt(fa + v.e) - v.a; v._d = d;
    g.poly([[-.3, fa - v.e], [3.2, fa - v.e], [3.2, fa + v.e], [-.3, fa + v.e]], C.g, .15);
    g.poly([[v.a - d, -.5], [v.a + d, -.5], [v.a + d, 8], [v.a - d, 8]], C.b, .18);
    g.fn(x => x * x, C.a, 2.5); g.fn(x => x * x, C.g, 3.5, null, v.a - d, v.a + d);
    g.dot(v.a, fa, C.text, 5);
    g.txt('f(a) ± ε', 3.2, fa + v.e, C.g, 'right', -4, -4, true); g.txt('a ± δ', v.a, 8, C.b, 'center', 0, 12, true);
  },
  info: v => 'ε = ' + f2(v.e) + ' → on peut prendre <b>δ = ' + f2(v._d, 3) + '</b> : tous les x de la bande orange ont leur image dans la bande verte. En a plus grand, la courbe est plus raide donc δ doit être plus petit : x² est continue partout mais <b>pas uniformément continue</b> sur ℝ.'
});

VIZ.dichotomie = el => {
  const f = x => x * x * x - x - 1;
  return widget(el, {
    title: 'TVI en action : la dichotomie', hint: 'f(1) < 0 < f(2) donc f s\'annule ; on coupe l\'intervalle en deux à chaque étape',
    sliders: [{ id: 'k', label: 'Étapes', min: 0, max: 14, step: 1, val: 0 }],
    draw: (g, v) => {
      g.view(.8, 2.2, -2, 5.5); g.axes('x', 'f(x) = x³ − x − 1');
      let a = 1, b = 2; const hist = [[a, b]];
      for (let i = 0; i < v.k; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; hist.push([a, b]); }
      v._a = a; v._b = b;
      hist.slice(-6).forEach((h, i, arr) => { const y = -2 + .25 + i * .22; g.seg(h[0], y, h[1], y, i === arr.length - 1 ? g.C.b : g.C.muted, i === arr.length - 1 ? 4 : 2); });
      g.poly([[a, -2], [b, -2], [b, 5.5], [a, 5.5]], g.C.b, .15);
      g.fn(f, g.C.a, 2.5); g.dot(a, f(a), g.C.r); g.dot(b, f(b), g.C.g);
    },
    info: v => 'La racine est dans [<b>' + f2(v._a, 5) + ' ; ' + f2(v._b, 5) + '</b>] &nbsp;·&nbsp; largeur = 1/2<sup>' + v.k + '</sup> = ' + (v._b - v._a).toExponential(1).replace('.', ',') + ' &nbsp;·&nbsp; f(a) &lt; 0 (rouge), f(b) &gt; 0 (vert)'
  });
};

VIZ.trigo = el => widget(el, {
  title: 'Cercle unité : cos, sin et aire du secteur', h: 320, maxW: 520,
  sliders: [{ id: 't', label: 'θ', min: 0, max: 6.28, step: .01, val: .9, fmt: x => f2(x) + ' rad' }],
  draw: (g, v) => {
    g.view(-1.35, 1.35, -1.25, 1.25, { square: true }); g.axes('x', 'y');
    const C = g.C, c = Math.cos(v.t), s = Math.sin(v.t), sec = [[0, 0]];
    for (let i = 0; i <= 60; i++) sec.push([Math.cos(v.t * i / 60), Math.sin(v.t * i / 60)]);
    g.poly(sec, C.b, .25); g.circle(0, 0, 1, C.muted, 1.5);
    g.seg(0, 0, c, 0, C.a, 4); g.seg(c, 0, c, s, C.g, 4); g.seg(0, 0, c, s, C.text, 1.5);
    g.dot(c, s, C.text, 5); g.txt('cos θ', c / 2, 0, C.a, 'center', 0, 16, true); g.txt('sin θ', c, s / 2, C.g, c >= 0 ? 'left' : 'right', c >= 0 ? 7 : -7, 4, true);
  },
  info: v => 'cos θ = <b>' + f2(Math.cos(v.t), 3) + '</b> &nbsp;·&nbsp; sin θ = <b>' + f2(Math.sin(v.t), 3) + '</b> &nbsp;·&nbsp; aire du secteur orange = θ/2 = <b>' + f2(v.t / 2, 3) + '</b> (c\'est ainsi que le cours <i>définit</i> cos et sin) &nbsp;·&nbsp; cos² + sin² = 1'
});

VIZ.convexe = el => {
  const f = x => .35 * x * x + .25 * Math.exp(x * .8);
  return widget(el, {
    title: 'Convexité : le graphe passe sous la corde',
    sliders: [{ id: 'a', label: 'x₀', min: -3, max: 0, step: .05, val: -2.2 }, { id: 'b', label: 'x₁', min: .2, max: 2.6, step: .05, val: 2 }, { id: 't', label: 't', min: 0, max: 1, step: .01, val: .45 }],
    draw: (g, v) => {
      g.view(-3.3, 3, -.5, 5.5); g.axes('x', 'f(x)');
      const C = g.C, x = (1 - v.t) * v.a + v.t * v.b, yc = (1 - v.t) * f(v.a) + v.t * f(v.b);
      g.fn(f, C.a, 2.5); g.seg(v.a, f(v.a), v.b, f(v.b), C.b, 2);
      g.seg(x, f(x), x, yc, C.r, 2.5); g.dot(v.a, f(v.a), C.b); g.dot(v.b, f(v.b), C.b); g.dot(x, yc, C.b, 5); g.dot(x, f(x), C.a, 5);
      g.txt('(1−t)f(x₀) + t f(x₁)', x, yc, C.b, 'left', 8, -6); g.txt('f((1−t)x₀ + t x₁)', x, f(x), C.a, 'left', 8, 16);
      v._f = f(x); v._c = yc;
    },
    info: v => 'f((1−t)x₀ + t x₁) = <b>' + f2(v._f) + '</b> ≤ (1−t)f(x₀) + t f(x₁) = <b>' + f2(v._c) + '</b> — l\'écart (en rouge) est toujours ≥ 0 : c\'est la définition de la convexité.'
  });
};

/* ---------- Algèbre linéaire ---------- */
const texM = (M, aug) => '\\left(\\begin{array}{' + M[0].map((_, j) => (aug && j === M[0].length - 1 ? '|c' : 'c')).join('') + '}' + M.map(r => r.map(x => Number.isInteger(x) ? x : (Math.round(x * 100) / 100).toString().replace('.', '{,}')).join('&')).join('\\\\') + '\\end{array}\\right)';
VIZ.pivot = el => {
  const A0 = [[0, 2, 4, 2], [1, 1, 3, 2], [2, 4, 10, 6]];
  const ops = [['swap', 0, 1], ['add', 2, 0, -2], ['add', 2, 1, -1], ['mul', 1, .5], ['add', 0, 1, -1]];
  const E = op => { const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; if (op[0] === 'swap') { [I[op[1]], I[op[2]]] = [I[op[2]], I[op[1]]]; } else if (op[0] === 'add') I[op[1]][op[2]] = op[3]; else I[op[1]][op[1]] = op[2]; return I; };
  const mul = (P, M) => P.map(r => M[0].map((_, j) => r.reduce((s, x, k) => s + x * M[k][j], 0)));
  const states = [A0]; ops.forEach(op => states.push(mul(E(op), states[states.length - 1])));
  const desc = op => op[0] === 'swap' ? ['L_' + (op[1] + 1) + '\\leftrightarrow L_' + (op[2] + 1), 'E_{' + (op[1] + 1) + ',' + (op[2] + 1) + '}', 'échange de deux lignes'] : op[0] === 'add' ? ['L_' + (op[1] + 1) + '\\leftarrow L_' + (op[1] + 1) + (op[3] < 0 ? '-' : '+') + (Math.abs(op[3]) === 1 ? '' : Math.abs(op[3])) + 'L_' + (op[2] + 1), 'E_{' + (op[1] + 1) + ',' + (op[2] + 1) + '}(' + op[3] + ')', 'ajout d\'un multiple d\'une ligne'] : ['L_' + (op[1] + 1) + '\\leftarrow \\tfrac12 L_' + (op[1] + 1), 'E_{' + (op[1] + 1) + '}(\\tfrac12)', 'multiplication d\'une ligne'];
  let k = 0;
  const w = widget(el, {
    title: 'Le pivot de Gauss, pas à pas', hint: 'Chaque opération = multiplication à gauche par une matrice élémentaire', noCanvas: true,
    buttons: [{ label: '← Précédent', on: () => { k = Math.max(0, k - 1); } }, { label: 'Étape suivante →', on: () => { k = Math.min(ops.length, k + 1); } }, { label: '↺ Recommencer', on: () => { k = 0; } }],
    draw: () => { },
    after: (v, api) => {
      let h = '<div class="pivot">';
      if (k === 0) h += '<div class="pv-step">Matrice de départ</div><div data-tex="A=' + texM(A0) + '"></div>';
      else { const d = desc(ops[k - 1]); h += '<div class="pv-step">Étape ' + k + '/' + ops.length + ' — ' + d[2] + ' : <span data-tex="' + d[0] + '" data-inline></span></div><div data-tex="\\underbrace{' + texM(E(ops[k - 1])) + '}_{' + d[1] + '}\\cdot' + texM(states[k - 1]) + '=' + texM(states[k]) + '"></div>'; }
      if (k === 3) h += '<div class="pv-note">Forme <b>échelonnée</b> : 2 pivots ⟹ rang(A) = 2.</div>';
      if (k === ops.length) h += '<div class="pv-note">Forme échelonnée <b>réduite</b> : pivots égaux à 1, zéros au-dessus. Rang = 2.</div>';
      api.extra.innerHTML = h + '</div>'; typeset(api.extra);
    }
  });
  return w;
};

VIZ.graphe = el => {
  const A = [[0, 0, 1, 0], [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 0]], P = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
  const mul = (X, Y) => X.map(r => Y[0].map((_, j) => r.reduce((s, x, k) => s + x * Y[k][j], 0)));
  return widget(el, {
    title: 'Compter les chemins avec Aᵏ', hint: 'Le graphe du polycopié', h: 250, maxW: 380,
    sliders: [{ id: 'k', label: 'Longueur k', min: 1, max: 8, step: 1, val: 1 }, { id: 'i', label: 'Départ vᵢ', min: 1, max: 4, step: 1, val: 2 }, { id: 'j', label: 'Arrivée vⱼ', min: 1, max: 4, step: 1, val: 3 }],
    draw: (g, v) => {
      g.view(-1.6, 1.6, -1.5, 1.5, { square: true, l: 6, b: 6 });
      const C = g.C;
      A.forEach((r, i) => r.forEach((x, j) => {
        if (!x) return; const both = A[j][i], [x1, y1] = P[i], [x2, y2] = P[j], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ox = both ? -dy / L * .09 : 0, oy = both ? dx / L * .09 : 0, s = .24 / L;
        g.arrow(x1 + dx * s + ox, y1 + dy * s + oy, x2 - dx * s + ox, y2 - dy * s + oy, C.muted, 1.8);
      }));
      P.forEach((p, i) => { const sel = i === v.i - 1 ? C.g : i === v.j - 1 ? C.r : C.a; g.circle(p[0], p[1], .2, sel, 2.5, sel, .25); g.txt('v' + '₁₂₃₄'[i], p[0], p[1], C.text, 'center', 0, 4, true); });
    },
    after: (v, api) => {
      let M = A; for (let n = 1; n < v.k; n++) M = mul(M, A);
      const t = '\\left(\\begin{array}{cccc}' + M.map((r, i) => r.map((x, j) => i === v.i - 1 && j === v.j - 1 ? '\\boxed{' + x + '}' : x).join('&')).join('\\\\') + '\\end{array}\\right)';
      api.extra.innerHTML = '<div class="pivot"><div data-tex="A^{' + v.k + '}=' + t + '"></div><div class="pv-note">(A<sup>' + v.k + '</sup>)<sub>' + v.i + ',' + v.j + '</sub> = <b>' + M[v.i - 1][v.j - 1] + '</b> : il y a ' + M[v.i - 1][v.j - 1] + ' chemin(s) de longueur ' + v.k + ' de <span style="color:#2f9e44">v<sub>' + v.i + '</sub></span> à <span style="color:#e03131">v<sub>' + v.j + '</sub></span>.</div></div>';
      typeset(api.extra);
    }
  });
};

VIZ.det2 = el => widget(el, {
  title: 'Le déterminant 2×2 = aire orientée du parallélogramme', hint: 'Glisse les extrémités des deux vecteurs colonnes', h: 330, maxW: 560,
  init: v => { v.u = [3, 1]; v.w = [1, 2]; v.sel = 'u'; },
  drag: (v, x, y, ph) => { const r = p => Math.round(p * 4) / 4; if (ph === 'down') v.sel = Math.hypot(x - v.u[0], y - v.u[1]) < Math.hypot(x - v.w[0], y - v.w[1]) ? 'u' : 'w'; v[v.sel] = [Math.max(-4, Math.min(4, r(x))), Math.max(-3, Math.min(3, r(y)))]; },
  draw: (g, v) => {
    g.view(-4.5, 5.5, -3.4, 3.8, { square: true }); g.axes('x', 'y');
    const C = g.C, d = v.u[0] * v.w[1] - v.w[0] * v.u[1], col = Math.abs(d) < 1e-9 ? C.muted : d > 0 ? C.a : C.r;
    g.poly([[0, 0], v.u, [v.u[0] + v.w[0], v.u[1] + v.w[1]], v.w], col, .25, col, 1);
    g.arrow(0, 0, v.u[0], v.u[1], C.g, 3); g.arrow(0, 0, v.w[0], v.w[1], C.b, 3);
    g.dot(v.u[0], v.u[1], C.g, 6); g.dot(v.w[0], v.w[1], C.b, 6);
    g.txt('(a, c)', v.u[0], v.u[1], C.g, 'left', 9, -7, true); g.txt('(b, d)', v.w[0], v.w[1], C.b, 'left', 9, -7, true);
  },
  info: v => { const d = v.u[0] * v.w[1] - v.w[0] * v.u[1]; return 'Det = ad − bc = (' + f2(v.u[0]) + ')(' + f2(v.w[1]) + ') − (' + f2(v.w[0]) + ')(' + f2(v.u[1]) + ') = <b>' + f2(d) + '</b> &nbsp;·&nbsp; aire = ' + f2(Math.abs(d)) + ' &nbsp;·&nbsp; ' + (Math.abs(d) < 1e-9 ? '<b style="color:#e03131">Det = 0 : colonnes alignées, matrice NON inversible</b>' : '<b>inversible</b> ' + (d > 0 ? '(orientation directe)' : '(orientation renversée : Det &lt; 0)')); }
});

/* ---------- Mécanique ---------- */
VIZ.projectile = el => widget(el, {
  title: 'Projectile avec et sans frottement',
  sliders: [{ id: 'a', label: 'Angle α', min: 5, max: 85, step: 1, val: 45, fmt: x => x + '°' }, { id: 'v0', label: 'v₀ (m/s)', min: 5, max: 30, step: 1, val: 22 }, { id: 'b', label: 'Frottement b/m', min: 0, max: 1, step: .02, val: .2 }],
  draw: (g, v) => {
    g.view(0, 95, 0, 48); g.axes('x (m)', 'z (m)');
    const al = v.a * Math.PI / 180, vx = v.v0 * Math.cos(al), vz = v.v0 * Math.sin(al), gr = 9.81;
    g.fn(x => x * Math.tan(al) - gr * x * x / (2 * vx * vx), g.C.muted, 1.8, [6, 4], 0, 2 * vx * vz / gr);
    const pts = [[0, 0]]; let x = 0, z = 0, ux = vx, uz = vz; const dt = .004;
    while (z >= 0 && pts.length < 5000) { ux += -v.b * ux * dt; uz += (-gr - v.b * uz) * dt; x += ux * dt; z += uz * dt; pts.push([x, z]); }
    g.path(pts, g.C.a, 2.5); v._r0 = 2 * vx * vz / gr; v._r = x;
  },
  info: v => 'Portée sans frottement (pointillés, parabole) = <b>' + f2(v._r0, 1) + ' m</b> &nbsp;·&nbsp; avec frottement = <b>' + f2(v._r, 1) + ' m</b>. Sans frottement, le maximum est à 45° ; avec frottement la trajectoire n\'est plus symétrique.'
});

VIZ.potentiel = el => widget(el, {
  title: 'Analyse qualitative : le pendule', hint: 'V(θ) = −mgl cos θ (énergie en unités de mgl)',
  sliders: [{ id: 'E', label: 'Énergie E', min: -.95, max: 2, step: .05, val: .2 }],
  draw: (g, v) => {
    g.view(-7, 7, -1.4, 2.3); g.axes('θ (rad)', 'V, E');
    const C = g.C, V = x => -Math.cos(x);
    if (v.E < 1) { const tm = Math.acos(-v.E); for (const c of [-2 * Math.PI, 0, 2 * Math.PI]) { const pts = [[c - tm, v.E]]; for (let i = 0; i <= 40; i++) { const x = c - tm + 2 * tm * i / 40; pts.push([x, V(x)]); } g.poly(pts, C.g, .25); if (c === 0) { g.dot(-tm, v.E, C.r); g.dot(tm, v.E, C.r); } } }
    else { const pts = [[-7, v.E]]; for (let i = 0; i <= 100; i++) { const x = -7 + 14 * i / 100; pts.push([x, V(x)]); } pts.push([7, v.E]); g.poly(pts, C.g, .2); }
    g.fn(V, C.a, 2.5); g.seg(-7, v.E, 7, v.E, C.b, 2); g.txt('E', 6.8, v.E, C.b, 'right', 0, -6, true);
    g.txt('équilibre stable', 0, -1, C.text, 'center', 0, 16); g.txt('instable', Math.PI, 1, C.text, 'center', 0, -8);
  },
  info: v => v.E < 1 ? '<b>Libration</b> (E &lt; mgl) : le pendule oscille entre les points de rebroussement ±θ<sub>max</sub> = ±' + f2(Math.acos(-v.E)) + ' rad (' + f2(Math.acos(-v.E) * 180 / Math.PI, 0) + '°), là où V = E (points rouges). Zone verte : énergie cinétique E − V ≥ 0.' : v.E > 1.001 ? '<b>Rotation</b> (E &gt; mgl) : l\'énergie dépasse le sommet du potentiel, le pendule fait des tours complets sans jamais s\'arrêter.' : '<b>Séparatrice</b> (E = mgl) : le pendule met un temps infini à atteindre la position verticale haute.'
});

VIZ.collision = el => {
  const w = widget(el, {
    title: 'Choc frontal à une dimension', h: 190,
    sliders: [{ id: 'm1', label: 'm₁', min: 1, max: 10, step: .5, val: 3 }, { id: 'm2', label: 'm₂ (au repos)', min: 1, max: 10, step: .5, val: 3 }],
    selects: [{ id: 'k', label: 'Type', options: [['e', 'Élastique'], ['i', 'Parfaitement inélastique']] }],
    buttons: [{ label: '▶ Lancer', on: (v, api) => { v.t = 0; api.play(dt => { v.t += dt; return v.t < 6; }); } }],
    init: v => { v.t = 0; },
    draw: (g, v) => {
      g.view(0, 20, 0, 4, { l: 10, b: 10 });
      const C = g.C, v1 = 3, s1 = .5 + .22 * Math.sqrt(v.m1), s2 = .5 + .22 * Math.sqrt(v.m2), x10 = 2, x20 = 10, tc = (x20 - s2 - (x10 + s1)) / v1;
      const e = v.k === 'e', u1 = e ? (v.m1 - v.m2) / (v.m1 + v.m2) * v1 : v.m1 * v1 / (v.m1 + v.m2), u2 = e ? 2 * v.m1 / (v.m1 + v.m2) * v1 : u1;
      v._u1 = u1; v._u2 = u2; v._v1 = v1;
      const t = v.t, x1 = t < tc ? x10 + v1 * t : x10 + v1 * tc + u1 * (t - tc), x2 = t < tc ? x20 : x20 + u2 * (t - tc);
      g.seg(0, .6, 20, .6, C.muted, 2);
      g.poly([[x1 - s1, .6], [x1 + s1, .6], [x1 + s1, .6 + 2 * s1], [x1 - s1, .6 + 2 * s1]], C.a, .8, C.a); g.poly([[x2 - s2, .6], [x2 + s2, .6], [x2 + s2, .6 + 2 * s2], [x2 - s2, .6 + 2 * s2]], C.b, .8, C.b);
      g.txt('m₁', x1, .6 + s1, '#fff', 'center', 0, 4, true); g.txt('m₂', x2, .6 + s2, '#fff', 'center', 0, 4, true);
      const a1 = t < tc ? v1 : u1, a2 = t < tc ? 0 : u2;
      if (Math.abs(a1) > .01) g.arrow(x1, .6 + 2 * s1 + .35, x1 + a1 * .6, .6 + 2 * s1 + .35, C.a, 2); if (Math.abs(a2) > .01) g.arrow(x2, .6 + 2 * s2 + .35, x2 + a2 * .6, .6 + 2 * s2 + .35, C.b, 2);
    },
    info: v => { const T0 = .5 * v.m1 * v._v1 * v._v1, T1 = .5 * v.m1 * v._u1 * v._u1 + .5 * v.m2 * v._u2 * v._u2; return 'Avant : v₁ = 3, v₂ = 0 &nbsp;→&nbsp; après : <b>v₁′ = ' + f2(v._u1) + '</b>, <b>v₂′ = ' + f2(v._u2) + '</b> &nbsp;·&nbsp; quantité de mouvement : ' + f2(v.m1 * v._v1, 1) + ' → ' + f2(v.m1 * v._u1 + v.m2 * v._u2, 1) + ' (conservée) &nbsp;·&nbsp; énergie cinétique : ' + f2(T0, 1) + ' → ' + f2(T1, 1) + (Math.abs(T0 - T1) < 1e-6 ? ' (conservée)' : ' <b style="color:#e03131">(perte de ' + f2((1 - T1 / T0) * 100, 0) + ' %)</b>'); }
  });
  return w;
};

VIZ.maxwell = el => {
  const kB = 1.380649e-23, u = 1.6605e-27;
  return widget(el, {
    title: 'Distribution des vitesses de Maxwell–Boltzmann',
    sliders: [{ id: 'T', label: 'T (K)', min: 50, max: 1200, step: 10, val: 300 }],
    selects: [{ id: 'm', label: 'Gaz', options: [['28', 'Diazote N₂ (28 u)'], ['4', 'Hélium (4 u)'], ['40', 'Argon (40 u)'], ['2', 'Dihydrogène H₂ (2 u)']] }],
    draw: (g, v) => {
      const m = +v.m * u, vmax = +v.m < 5 ? 6000 : 2000, a = m / (2 * kB * v.T), f = x => 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * x * x * Math.exp(-a * x * x) * 1000;
      const vp = Math.sqrt(2 * kB * v.T / m), vm = Math.sqrt(8 * kB * v.T / (Math.PI * m)), vr = Math.sqrt(3 * kB * v.T / m);
      v._ = [vp, vm, vr];
      g.view(0, vmax, 0, +v.m < 5 ? 1.2 : 3.6); g.axes('v (m/s)', 'f(v)', {});
      const pts = [[0, 0]]; for (let i = 0; i <= 200; i++) pts.push([vmax * i / 200, f(vmax * i / 200)]); pts.push([vmax, 0]); g.poly(pts, g.C.a, .18);
      g.fn(f, g.C.a, 2.5);
      [[vp, g.C.g, 'v plus probable'], [vm, g.C.b, 'v moyenne'], [vr, g.C.r, 'v_rms']].forEach(([x, c, l], i) => { g.seg(x, 0, x, f(x), c, 2); g.txt(l, x, f(x), c, 'left', 6, -6 + i * 15, true); });
    },
    info: v => 'v la plus probable = <b>' + f2(v._[0], 0) + '</b> m/s &lt; v moyenne = <b>' + f2(v._[1], 0) + '</b> m/s &lt; v<sub>rms</sub> = √(3k<sub>B</sub>T/m) = <b>' + f2(v._[2], 0) + '</b> m/s. Chauffer élargit la courbe ; un gaz léger est plus rapide.'
  });
};

VIZ.lorentz = el => widget(el, {
  title: 'Facteur de Lorentz γ', hint: 'Les effets relativistes n\'apparaissent que près de c',
  sliders: [{ id: 'b', label: 'β = v/c', min: 0, max: .995, step: .005, val: .6, fmt: x => f2(x, 3) }],
  draw: (g, v) => {
    g.view(0, 1, 0, 8); g.axes('β = v/c', 'γ');
    const C = g.C, ga = 1 / Math.sqrt(1 - v.b * v.b); v._g = ga;
    g.fn(b => 1 / Math.sqrt(1 - b * b), C.a, 2.5, null, 0, .9995); g.seg(1, 0, 1, 8, C.r, 1, [4, 4]);
    g.seg(v.b, 0, v.b, Math.min(ga, 8), C.muted, 1, [3, 3]); g.dot(v.b, Math.min(ga, 8), C.b, 6);
    // règle au repos / contractée, horloge
    g.txt('règle au repos : L₀', .05, 7.4, C.text); g.poly([[.05, 6.6], [.45, 6.6], [.45, 7], [.05, 7]], C.g, .6, C.g);
    g.txt('en mouvement : L₀/γ', .05, 6, C.text); g.poly([[.05, 5.2], [.05 + .4 / ga, 5.2], [.05 + .4 / ga, 5.6], [.05, 5.6]], C.b, .7, C.b);
  },
  info: v => 'γ = <b>' + f2(v._g, 3) + '</b> &nbsp;·&nbsp; 1 s de temps propre dure <b>' + f2(v._g, 3) + ' s</b> pour l\'observateur (dilatation) &nbsp;·&nbsp; une règle de 1 m mesure <b>' + f2(1 / v._g, 3) + ' m</b> (contraction) &nbsp;·&nbsp; énergie cinétique = (γ−1)mc² = ' + f2(v._g - 1, 3) + ' mc²' + (v.b < .15 ? ' ≈ ½mv² (régime classique)' : '')
});

VIZ.oscillateur = el => widget(el, {
  title: 'Oscillateur amorti : les trois régimes', hint: 'q(0) = 1, vitesse initiale nulle',
  sliders: [{ id: 'l', label: 'Amortissement λ', min: 0, max: 5, step: .05, val: .3 }, { id: 'w', label: 'ω₀', min: 1, max: 4, step: .1, val: 2 }],
  draw: (g, v) => {
    g.view(0, 12, -1.1, 1.15); g.axes('t', 'q(t)');
    const C = g.C, l = v.l, w = v.w, d = w * w - l * l;
    let q; if (d > 1e-6) { const w1 = Math.sqrt(d); q = t => Math.exp(-l * t) * (Math.cos(w1 * t) + l / w1 * Math.sin(w1 * t)); g.fn(t => Math.exp(-l * t), C.muted, 1.2, [5, 4]); g.fn(t => -Math.exp(-l * t), C.muted, 1.2, [5, 4]); }
    else if (d < -1e-6) { const s = Math.sqrt(-d); q = t => Math.exp(-l * t) * (Math.cosh(s * t) + l / s * Math.sinh(s * t)); }
    else q = t => (1 + l * t) * Math.exp(-l * t);
    g.fn(t => (1 + w * t) * Math.exp(-w * t), C.g, 1.5, [2, 3]);
    g.fn(q, d > 1e-6 ? C.a : d < -1e-6 ? C.r : C.g, 2.5);
  },
  info: v => { const d = v.w * v.w - v.l * v.l; return (Math.abs(v.l - v.w) < .026 ? '<b style="color:#2f9e44">Amortissement critique</b> (λ = ω₀) : retour le plus rapide à l\'équilibre, sans oscillation.' : d > 0 ? '<b style="color:var(--c)">Amortissement faible</b> (λ &lt; ω₀) : oscillations de pulsation ω₁ = √(ω₀² − λ²) = <b>' + f2(Math.sqrt(d)) + '</b> &lt; ω₀, dans l\'enveloppe e<sup>−λt</sup> (pointillés gris).' : '<b style="color:#e03131">Suramortissement</b> (λ &gt; ω₀) : pas d\'oscillation, et le retour est <i>plus lent</i> qu\'en régime critique.') + ' <span style="color:#2f9e44">┄</span> régime critique pour comparaison.'; }
});

VIZ.resonance = el => widget(el, {
  title: 'Résonance d\'un oscillateur forcé', hint: 'ω₀ = 2',
  sliders: [{ id: 'l', label: 'Amortissement λ', min: .05, max: 1.5, step: .01, val: .2 }, { id: 'w', label: 'ω de la force', min: 0, max: 5, step: .02, val: 1 }],
  draw: (g, v) => {
    const w0 = 2, A = w => 1 / Math.sqrt((w0 * w0 - w * w) ** 2 + 4 * v.l * v.l * w * w), de = w => { let d = Math.atan2(2 * v.l * w, w0 * w0 - w * w); return d < 0 ? d + Math.PI : d; };
    g.view(0, 5, 0, 2.6); g.axes('ω', 'A(ω)');
    const C = g.C; g.seg(w0, 0, w0, 2.6, C.muted, 1, [4, 4]); g.txt('ω₀', w0, 2.6, C.muted, 'left', 4, 12);
    g.fn(w => de(w) / Math.PI * 2.4, C.p, 1.5, [5, 3]); g.txt('déphasage δ (0 → π)', 5, 2.4, C.p, 'right', -4, 14);
    g.fn(A, C.a, 2.5); g.dot(v.w, Math.min(A(v.w), 2.6), C.b, 6);
    v._A = A(v.w); v._d = de(v.w); v._wr = w0 * w0 > 2 * v.l * v.l ? Math.sqrt(w0 * w0 - 2 * v.l * v.l) : 0;
  },
  info: v => 'Amplitude A(ω) = <b>' + f2(v._A, 3) + '</b> (en unités de F₀/m) &nbsp;·&nbsp; déphasage δ = <b>' + f2(v._d / Math.PI, 2) + ' π</b> &nbsp;·&nbsp; pic à ω<sub>r</sub> = √(ω₀² − 2λ²) = <b>' + f2(v._wr) + '</b>. Diminue λ : le pic devient plus haut et plus étroit.'
});

VIZ.coriolis = el => widget(el, {
  title: 'Force de Coriolis : la même trajectoire vue de deux référentiels', h: 300,
  sliders: [{ id: 'O', label: 'Rotation Ω du plateau', min: -2, max: 2, step: .05, val: 1 }, { id: 't', label: 'temps', min: 0, max: 2, step: .01, val: 2 }],
  buttons: [{ label: '▶ Animer', on: (v, api) => { v.t = 0; api.play(dt => { v.t = Math.min(2, v.t + dt * .7); api.slider('t').set(v.t); return v.t < 2; }); } }],
  draw: (g, v) => {
    const C = g.C, half = (g.W - 30) / 2, R = 1.15;
    const panel = (cx, title, rot) => {
      g.pl = cx; g.pr = g.W - cx - half; g.pt = 26; g.pb = 8; g.x0 = -1.3; g.x1 = 1.3; const h = (g.H - 34) / half * 1.3; g.y0 = -h; g.y1 = h;
      g.circle(0, 0, R, C.muted, 1.5, C.a, .06);
      const ang = rot ? 0 : v.O * v.t; for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; g.seg(0, 0, R * Math.cos(a), R * Math.sin(a), C.grid, 1); }
      g.dot(R * Math.cos(ang), R * Math.sin(ang), C.muted, 4);
      const pts = []; for (let i = 0; i <= 80; i++) { const t = v.t * i / 80, r = Math.min(R, .575 * t), a = rot ? -v.O * t + .5 : .5; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
      g.path(pts, rot ? C.r : C.g, 2.5); const p = pts[pts.length - 1]; g.dot(p[0], p[1], C.text, 5);
      g.ctx.fillStyle = C.text; g.ctx.font = '600 12px Segoe UI'; g.ctx.textAlign = 'center'; g.ctx.fillText(title, cx + half / 2, 16);
    };
    panel(10, 'Référentiel inertiel (le plateau tourne)', false); panel(20 + half, 'Référentiel tournant (lié au plateau)', true);
  },
  info: v => 'À gauche, aucune force : la bille va <b>en ligne droite</b>. À droite, vue depuis le plateau, elle est <b>déviée</b>' + (Math.abs(v.O) < .03 ? ' (pas ici : Ω = 0)' : v.O > 0 ? ' vers la <b>droite</b> de son mouvement (Ω &gt; 0, rotation antihoraire comme vu du pôle Nord)' : ' vers la <b>gauche</b> (Ω &lt; 0, comme dans l\'hémisphère sud)') + ' : pour l\'expliquer avec F = ma, il faut ajouter la force fictive de Coriolis −2m ω × v′.'
});

VIZ.venturi = el => widget(el, {
  title: 'Effet Venturi (continuité + Bernoulli)', h: 230,
  sliders: [{ id: 'r', label: 'Section A₂/A₁', min: .2, max: 1, step: .01, val: .4 }, { id: 'v1', label: 'v₁ (m/s)', min: .5, max: 4, step: .1, val: 2 }],
  draw: (g, v) => {
    g.view(0, 10, -2.2, 3.4, { l: 8, b: 8 });
    const C = g.C, h1 = 1, h2 = v.r, prof = x => x < 3 ? h1 : x < 4.5 ? h1 + (h2 - h1) * (x - 3) / 1.5 : x < 6.5 ? h2 : x < 8 ? h2 + (h1 - h2) * (x - 6.5) / 1.5 : h1;
    const top = [], bot = []; for (let i = 0; i <= 100; i++) { const x = i / 10; top.push([x, prof(x)]); bot.push([x, -prof(x)]); }
    g.poly(top.concat(bot.reverse()), C.a, .18); g.path(top, C.text, 2); g.path(bot, C.text, 2);
    const v2 = v.v1 / v.r, dp = .5 * 1000 * (v2 * v2 - v.v1 * v.v1); v._v2 = v2; v._dp = dp;
    for (const y of [-.5, 0, .5]) { g.arrow(.5, y * h1, .5 + v.v1 * .45, y * h1, C.a, 2); g.arrow(4.7, y * h2, 4.7 + Math.min(v2 * .45, 4.6), y * h2, C.r, 2); }
    // manomètres : hauteur ∝ pression
    const H1 = 1.9, H2 = Math.max(.08, H1 - dp / 1000 / 9.81 * .35);
    [[1.5, h1, H1, 'p₁'], [5.5, h2, H2, 'p₂']].forEach(([x, hh, HH, lab]) => { g.poly([[x - .15, hh], [x + .15, hh], [x + .15, hh + HH], [x - .15, hh + HH]], C.a, .5); g.seg(x - .15, hh, x - .15, 3.2, C.text, 1.5); g.seg(x + .15, hh, x + .15, 3.2, C.text, 1.5); g.txt(lab, x, hh + HH, C.text, 'left', 10, 4, true); });
    g.txt('v₁', .6, -.5 * h1, C.a, 'left', 0, 22, true); g.txt('v₂', 4.8, -.5 * h2, C.r, 'left', 0, 22, true);
  },
  info: v => 'Continuité : v₂ = v₁·A₁/A₂ = <b>' + f2(v._v2) + ' m/s</b> &nbsp;·&nbsp; Bernoulli (eau) : p₁ − p₂ = ½ρ(v₂² − v₁²) = <b>' + f2(v._dp / 1000, 2) + ' kPa</b>. Là où le tube est étroit, le fluide va vite et la pression est <b>basse</b> (colonne d\'eau plus courte).'
});

/* ---------- Physique macroscopique ---------- */
VIZ.gazparfait = el => {
  let parts = [];
  return widget(el, {
    title: 'Gaz parfait : PV = N k_B T', h: 230,
    sliders: [{ id: 'T', label: 'Température T (K)', min: 100, max: 900, step: 10, val: 300 }, { id: 'V', label: 'Volume V', min: .3, max: 1, step: .01, val: .7 }, { id: 'N', label: 'Particules N', min: 10, max: 150, step: 5, val: 60 }],
    init: (v, api) => { api.play(dt => { v.dt = dt; }); },
    draw: (g, v) => {
      g.view(0, 1.25, 0, 1, { l: 8, b: 8, t: 8, r: 8 });
      const C = g.C; while (parts.length < v.N) { const a = Math.random() * 7; parts.push({ x: Math.random() * v.V, y: Math.random(), c: Math.cos(a), s: Math.sin(a), k: .5 + Math.random() }); } parts.length = v.N;
      const sp = Math.sqrt(v.T / 300) * .45, dt = v.dt || 0;
      g.poly([[0, 0], [v.V, 0], [v.V, 1], [0, 1]], C.a, .08, C.text, 2);
      g.poly([[v.V, 0], [v.V + .04, 0], [v.V + .04, 1], [v.V, 1]], C.muted, .9); g.seg(v.V + .04, .5, 1.02, .5, C.muted, 4);
      parts.forEach(p => { p.x += p.c * p.k * sp * dt; p.y += p.s * p.k * sp * dt; if (p.x < .01) { p.x = .01; p.c = Math.abs(p.c); } if (p.x > v.V - .01) { p.x = v.V - .01; p.c = -Math.abs(p.c); } if (p.y < .02) { p.y = .02; p.s = Math.abs(p.s); } if (p.y > .98) { p.y = .98; p.s = -Math.abs(p.s); } g.dot(p.x, p.y, C.a, 3); });
      const P = v.N * v.T / v.V / (60 * 300 / .7); v._P = P;
      g.txt('Pression', 1.08, .96, C.text, 'left', 0, 0, true); g.poly([[1.08, .05], [1.2, .05], [1.2, .88], [1.08, .88]], null, 0, C.muted, 1);
      const hh = Math.min(1, P / 6) * .83; g.poly([[1.08, .05], [1.2, .05], [1.2, .05 + hh], [1.08, .05 + hh]], P > 3 ? C.r : C.b, .85);
    },
    info: v => 'P = N k<sub>B</sub> T / V = <b>' + f2(v._P) + ' bar</b> (réglage de départ ≈ 1 bar). Chauffer (les particules vont plus vite), comprimer ou ajouter des particules augmente le nombre et la violence des chocs sur les parois, donc la pression.'
  });
};

VIZ.pv = el => widget(el, {
  title: 'Diagramme (P, V) : isotherme contre adiabatique', hint: 'Départ : P = 1, V = 1',
  sliders: [{ id: 'V', label: 'Volume final V_f', min: .35, max: 3, step: .01, val: 2.2 }],
  selects: [{ id: 'g', label: 'γ', options: [['1.667', '5/3 (monoatomique)'], ['1.4', '7/5 (diatomique)']] }],
  draw: (g, v) => {
    g.view(0, 3.2, 0, 3.6); g.axes('V', 'P');
    const C = g.C, ga = +v.g, iso = x => 1 / x, ad = x => Math.pow(x, -ga), a = Math.min(1, v.V), b = Math.max(1, v.V);
    const pts = [[a, 0]]; for (let i = 0; i <= 60; i++) { const x = a + (b - a) * i / 60; pts.push([x, iso(x)]); } pts.push([b, 0]); g.poly(pts, C.a, .2);
    g.fn(iso, C.a, 2.5, null, .28, 3.2); g.fn(ad, C.r, 2.5, null, .28, 3.2);
    g.dot(1, 1, C.text, 5); g.dot(v.V, iso(v.V), C.a, 5); g.dot(v.V, Math.min(ad(v.V), 3.6), C.r, 5);
    g.txt('isotherme PV = cste', 2.35, iso(2.35), C.a, 'left', 0, -8, true); g.txt('adiabatique PVᵞ = cste', .62, Math.min(3.3, ad(.62)), C.r, 'left', 8, 4, true);
  },
  info: v => { const ga = +v.g, Wi = -Math.log(v.V), Wa = (Math.pow(v.V, 1 - ga) - 1) / (ga - 1); return (v.V > 1 ? 'Détente' : 'Compression') + ' — travail <b>reçu</b> par le gaz (en unités de Nk<sub>B</sub>T<sub>i</sub>) : isotherme W = −ln(V<sub>f</sub>/V<sub>i</sub>) = <b>' + f2(Wi) + '</b> (aire bleue), adiabatique W = <b>' + f2(Wa) + '</b>. Sur l\'adiabatique la température change : T<sub>f</sub>/T<sub>i</sub> = <b>' + f2(Math.pow(v.V, 1 - ga)) + '</b>. L\'adiabatique est plus pentue que l\'isotherme.'; }
});

VIZ.entropie = el => widget(el, {
  title: 'Second principe : un solide plongé dans une source', hint: 'Entropies en unités de la capacité calorifique C', h: 240,
  sliders: [{ id: 'T1', label: 'T₁ du solide (K)', min: 100, max: 800, step: 10, val: 600 }, { id: 'T0', label: 'T₀ de la source (K)', min: 100, max: 800, step: 10, val: 300 }],
  draw: (g, v) => {
    const a = Math.log(v.T0 / v.T1), b = (v.T1 - v.T0) / v.T0, t = a + b; v._ = [a, b, t];
    const m = Math.max(.5, Math.abs(a), Math.abs(b)) * 1.25;
    g.view(0, 4, -m, m, { l: 44 }); g.axes('', 'ΔS / C');
    const C = g.C; [[a, C.a, 'ΔS solide'], [b, C.b, 'ΔS source'], [t, C.g, 'ΔS univers']].forEach(([y, c, l], i) => { const x = .6 + i * 1.2; g.poly([[x, 0], [x + .7, 0], [x + .7, y], [x, y]], c, .8, c); g.txt(l, x + .35, y, C.text, 'center', 0, y >= 0 ? -6 : 15, true); });
  },
  info: v => 'ΔS<sub>solide</sub> = C ln(T₀/T₁) = <b>' + f2(v._[0], 3) + ' C</b> &nbsp;·&nbsp; ΔS<sub>source</sub> = C (T₁−T₀)/T₀ = <b>' + f2(v._[1], 3) + ' C</b> &nbsp;·&nbsp; total = <b style="color:#2f9e44">' + f2(v._[2], 3) + ' C ≥ 0</b>. ' + (v.T1 === v.T0 ? 'Températures égales : rien ne se passe, ΔS = 0 (réversible).' : 'Quelles que soient les températures, l\'entropie de l\'univers augmente : la transformation est irréversible.')
});

VIZ.carnot = el => widget(el, {
  title: 'Cycle de Carnot', hint: 'Gaz parfait monoatomique',
  sliders: [{ id: 'Tc', label: 'Source chaude T_c (K)', min: 400, max: 700, step: 10, val: 600 }, { id: 'Tf', label: 'Source froide T_f (K)', min: 250, max: 390, step: 10, val: 300 }],
  draw: (g, v) => {
    const C = g.C, k = Math.pow(v.Tc / v.Tf, 1.5), V1 = 1, V2 = 2, V3 = V2 * k, V4 = V1 * k, tc = v.Tc / 300, tf = v.Tf / 300;
    g.view(0, V3 * 1.08, 0, tc / V1 * 1.1); g.axes('V', 'P');
    const cyc = [], add = (f, a, b) => { for (let i = 0; i <= 40; i++) { const x = a + (b - a) * i / 40; cyc.push([x, f(x)]); } };
    add(x => tc / x, V1, V2); add(x => tc / V2 * Math.pow(V2 / x, 5 / 3), V2, V3); add(x => tf / x, V3, V4); add(x => tf / V4 * Math.pow(V4 / x, 5 / 3), V4, V1);
    g.poly(cyc, C.g, .25);
    g.path(cyc.slice(0, 41), C.r, 3); g.path(cyc.slice(41, 82), C.muted, 2.5); g.path(cyc.slice(82, 123), C.a, 3); g.path(cyc.slice(123), C.muted, 2.5);
    [[V1, tc / V1, '1'], [V2, tc / V2, '2'], [V3, tf / V3, '3'], [V4, tf / V4, '4']].forEach(p => { g.dot(p[0], p[1], C.text, 4); g.txt(p[2], p[0], p[1], C.text, 'left', 7, -6, true); });
    g.txt('isotherme T_c (reçoit Q_c)', (V1 + V2) / 2, tc / ((V1 + V2) / 2), C.r, 'left', 10, -8, true); g.txt('isotherme T_f (cède |Q_f|)', (V3 + V4) / 2, tf / ((V3 + V4) / 2), C.a, 'center', 0, 18, true);
    g.txt('W', (V2 + V4) / 2, (tc / V2 + tf / V4) / 2, C.g, 'center', 0, 4, true);
  },
  info: v => { const e = 1 - v.Tf / v.Tc; return 'Rendement η = 1 − T<sub>f</sub>/T<sub>c</sub> = <b>' + f2(e * 100, 1) + ' %</b>. Pour 100 J pris à la source chaude : <b>' + f2(e * 100, 1) + ' J</b> de travail (aire verte) et ' + f2((1 - e) * 100, 1) + ' J rejetés à la source froide. En gris : les deux adiabatiques. Pour améliorer le rendement, écarte les deux températures.'; }
});

VIZ.phases = el => widget(el, {
  title: 'Changements d\'état de 1 kg d\'eau', hint: 'On chauffe de la glace à −20 °C, à pression atmosphérique', h: 290,
  sliders: [{ id: 'Q', label: 'Chaleur fournie Q (kJ)', min: 0, max: 3099, step: 1, val: 500, fmt: x => x + ' kJ' }],
  draw: (g, v) => {
    const C = g.C, seg = [[0, -20], [42, 0], [376, 0], [794, 100], [3059, 100], [3099, 120]];
    const T = q => { for (let i = 1; i < seg.length; i++) if (q <= seg[i][0]) return seg[i - 1][1] + (seg[i][1] - seg[i - 1][1]) * (q - seg[i - 1][0]) / (seg[i][0] - seg[i - 1][0]); return 120; };
    const split = g.W * .42;
    // diagramme de phase (schématique)
    g.view(0, 10, 0, 10, { l: 26, r: g.W - split + 16, b: 24, t: 20 }); g.axes('T', 'P', { noticks: true });
    const tri = [3, 2.2], cr = [8.2, 7.4];
    g.path([[0, 0], [1.5, .7], tri], C.text, 2); g.path([tri, [2.75, 9.8]], C.text, 2); // pente négative : particularité de l'eau
    const vap = []; for (let i = 0; i <= 30; i++) { const t = i / 30; vap.push([tri[0] + (cr[0] - tri[0]) * t, tri[1] + (cr[1] - tri[1]) * t * t * .6 + (cr[1] - tri[1]) * t * .4]); } g.path(vap, C.text, 2);
    g.txt('solide', 1.4, 5.5, C.a, 'center', 0, 0, true); g.txt('liquide', 5, 6.1, C.g, 'center', 0, 0, true); g.txt('gaz', 6.8, 2, C.r, 'center', 0, 0, true);
    g.dot(tri[0], tri[1], C.b, 5); g.txt('point triple', tri[0], tri[1], C.b, 'left', 8, 12); g.dot(cr[0], cr[1], C.p, 5); g.txt('point critique C', cr[0], cr[1], C.p, 'right', -6, -8);
    const Tn = T(v.Q), yy = 4.3, xx = 2.93 + Tn * (5.87 - 2.93) / 100; // 0 °C et 100 °C tombent sur les frontières à 1 atm g.seg(.4, yy, 9.6, yy, C.muted, 1, [3, 3]); g.txt('1 atm', 9.6, yy, C.muted, 'right', 0, -5); g.dot(Math.min(xx, 9.4), yy, C.text, 5);
    // courbe de chauffage
    g.view(0, 3150, -30, 135, { l: split + 40, b: 24, t: 20 }); g.axes('Q (kJ)', 'T (°C)');
    g.path(seg, C.muted, 2); const done = seg.filter(s => s[0] < v.Q).concat([[v.Q, Tn]]); g.path(done, C.r, 3.5);
    g.dot(v.Q, Tn, C.text, 6); g.txt('fusion (334 kJ)', 420, 0, C.text, 'left', 0, -6); g.txt('vaporisation (2265 kJ)', 1900, 100, C.text, 'center', 0, -9);
    v._T = Tn; v._st = v.Q < 42 ? 'Glace qui se réchauffe' : v.Q < 376 ? 'Fusion : glace + eau liquide coexistent (' + Math.round((v.Q - 42) / 334 * 100) + ' % fondu)' : v.Q < 794 ? 'Eau liquide qui se réchauffe' : v.Q < 3059 ? 'Ébullition : liquide + vapeur coexistent (' + Math.round((v.Q - 794) / 2265 * 100) + ' % vaporisé)' : 'Vapeur qui se réchauffe';
  },
  info: v => '<b>' + v._st + '</b> — T = <b>' + f2(v._T, 0) + ' °C</b>. Sur les deux <b>plateaux</b>, la température ne bouge pas : toute la chaleur sert à changer de phase (chaleur latente). Le plateau de vaporisation est énorme comparé au chauffage du liquide (418 kJ).'
});

function mountViz(root) {
  root.querySelectorAll('.viz[data-viz]').forEach(el => {
    const f = VIZ[el.dataset.viz];
    if (f) { try { f(el); } catch (e) { el.innerHTML = '<div class="viz-info">Visualisation indisponible : ' + esc(e.message) + '</div>'; console.error(e); } }
  });
}
