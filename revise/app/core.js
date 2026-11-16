// Analyse du format texte des cours + utilitaires de rendu
const COURSES = [];

function addCourse(meta, raw) {
  meta.chapters = parseCourse(raw);
  COURSES.push(meta);
}

function parseCourse(raw) {
  const chapters = [];
  let ch = null, mode = null, sec = null, q = null;
  for (const line of raw.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith('@chapter ')) {
      const p = l.slice(9).split('|');
      ch = { id: p[0].trim(), title: p[1].trim(), intro: '', sections: [], formulas: [], pitfalls: [], cards: [], quiz: [] };
      chapters.push(ch); mode = null; continue;
    }
    if (l.startsWith('@intro ')) { ch.intro = l.slice(7); continue; }
    if (l.startsWith('@section ')) { sec = { title: l.slice(9), lines: [] }; ch.sections.push(sec); mode = 'section'; continue; }
    if (l === '@formulas' || l === '@pitfalls' || l === '@cards' || l === '@quiz') { mode = l.slice(1); continue; }
    if (mode === 'section') sec.lines.push(l);
    else if (mode === 'formulas') { const i = l.indexOf(' :: '); ch.formulas.push({ name: l.slice(0, i), tex: l.slice(i + 4) }); }
    else if (mode === 'pitfalls') ch.pitfalls.push(l.replace(/^- /, ''));
    else if (mode === 'cards') { const i = l.indexOf(' :: '); ch.cards.push({ q: l.slice(0, i), a: l.slice(i + 4) }); }
    else if (mode === 'quiz') {
      if (l.startsWith('? ')) { q = { q: l.slice(2), ok: '', wrong: [], e: '' }; ch.quiz.push(q); }
      else if (l.startsWith('+ ')) q.ok = l.slice(2);
      else if (l.startsWith('- ')) q.wrong.push(l.slice(2));
      else if (l.startsWith('= ')) q.e = l.slice(2);
    }
  }
  return chapters;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Texte en ligne : protège les maths ($...$), échappe le HTML, gère **gras**
function fmt(t) {
  const math = [];
  let s = t.replace(/\$\$[\s\S]+?\$\$|\$[^$]+\$/g, m => { math.push(m); return '\u0001' + (math.length - 1) + '\u0002'; });
  s = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => esc(math[+i]));
}

function renderLines(lines) {
  let out = '', inList = false;
  const close = () => { if (inList) { out += '</ul>'; inList = false; } };
  for (const l of lines) {
    if (l.startsWith('- ')) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + fmt(l.slice(2)) + '</li>'; continue; }
    close();
    const m = l.match(/^\{\{viz:(\w+)\}\}$/);
    if (m) out += '<div class="viz" data-viz="' + m[1] + '"></div>';
    else if (l.startsWith('> ')) out += '<div class="box key"><span class="tag">À retenir</span>' + fmt(l.slice(2)) + '</div>';
    else if (l.startsWith('! ')) out += '<div class="box warn"><span class="tag">Attention</span>' + fmt(l.slice(2)) + '</div>';
    else if (l.startsWith('ex: ')) out += '<div class="box ex"><span class="tag">Exemple</span>' + fmt(l.slice(4)) + '</div>';
    else out += '<p>' + fmt(l) + '</p>';
  }
  close();
  return out;
}

const KATEX_OPT = { throwOnError: false, strict: false };
function typeset(el) {
  if (window.renderMathInElement) renderMathInElement(el, Object.assign({
    delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
  }, KATEX_OPT));
  el.querySelectorAll('[data-tex]').forEach(n => {
    try { katex.render(n.dataset.tex, n, Object.assign({ displayMode: n.dataset.inline == null }, KATEX_OPT)); } catch (e) { n.textContent = n.dataset.tex; }
  });
}

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
