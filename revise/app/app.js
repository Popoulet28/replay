// Application : navigation, progression, quiz, flashcards
const $ = (s, r) => (r || document).querySelector(s);
const view = $('#view'), side = $('#side');

/* ---------- Stockage ---------- */
const KEY = 'revise-v1';
const DEF = { read: {}, quiz: {}, q: {}, cards: {}, notes: {}, exam: {}, examBest: {}, days: {}, theme: 'light', last: null };
let S = Object.assign({}, DEF);
try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
const dayStr = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const touch = (n) => { const k = dayStr(); S.days[k] = (S.days[k] || 0) + (n || 1); save(); };
function streak() { let n = 0; const d = new Date(); if (!S.days[dayStr(d)]) d.setDate(d.getDate() - 1); while (S.days[dayStr(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }

/* ---------- Accès aux données ---------- */
const course = id => COURSES.find(c => c.id === id);
const chapKey = (c, ch) => c.id + '/' + ch.id;
const allChaps = () => COURSES.flatMap(c => c.chapters.map(ch => ({ c, ch })));
const qid = (c, ch, i) => chapKey(c, ch) + '#q' + i;
const cid = (c, ch, i) => chapKey(c, ch) + '#c' + i;
const chapQs = (c, ch) => ch.quiz.map((_, i) => ({ c, ch, i }));
const chapCards = (c, ch) => ch.cards.map((_, i) => ({ c, ch, i }));

function chapProgress(c, ch) {
  const k = chapKey(c, ch), best = S.quiz[k] ? S.quiz[k].best : 0;
  const known = ch.cards.filter((_, i) => (S.cards[cid(c, ch, i)] || {}).b >= 2).length / Math.max(1, ch.cards.length);
  return (S.read[k] ? .3 : 0) + .5 * best + .2 * known;
}
const courseProgress = c => c.chapters.reduce((s, ch) => s + chapProgress(c, ch), 0) / c.chapters.length;
function dueCards(list) { const t = dayNum(); return list.filter(x => { const st = S.cards[cid(x.c, x.ch, x.i)]; return st && st.d <= t; }); }
const newCards = list => list.filter(x => !S.cards[cid(x.c, x.ch, x.i)]);
const wrongQs = () => allChaps().flatMap(({ c, ch }) => chapQs(c, ch)).filter(x => { const s = S.q[qid(x.c, x.ch, x.i)]; return s && s.last === 0; });

/* ---------- Routage ---------- */
let SESSION = null;
const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };
window.addEventListener('hashchange', render);

function render() {
  vizCleanup();
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let html = '', c = null;
  if (!p.length) html = vHome();
  else if (p[0] === 'c' && course(p[1])) { c = course(p[1]); const ch = c.chapters.find(x => x.id === p[2]); html = ch ? vChapter(c, ch, p[3] || 'resume') : vCourse(c); }
  else if (p[0] === 'quiz') html = vQuizHub();
  else if (p[0] === 'cartes') html = vCardsHub();
  else if (p[0] === 'formules') html = vFormulas();
  else if (p[0] === 'recherche') html = vSearch();
  else if (p[0] === 'session' && SESSION) { c = SESSION.c; html = SESSION.type === 'quiz' ? vQuiz() : vCards(); }
  else html = vHome();
  view.style.setProperty('--c', c ? c.color : '#4c6ef5');
  view.innerHTML = html;
  typeset(view); mountViz(view);
  renderSide(p);
  if (p[0] !== 'session') $('#main').scrollTop = 0;
  const f = $('[data-autofocus]', view); if (f) f.focus();
}

function renderSide(p) {
  const act = (cond) => cond ? ' class="on"' : '';
  const due = dueCards(allChaps().flatMap(({ c, ch }) => chapCards(c, ch))).length, wr = wrongQs().length;
  side.innerHTML = '<a class="brand" href="#/"><span class="logo">R</span><span>Révise<small>Première année</small></span></a>' +
    '<nav><a href="#/"' + act(!p.length) + '><i>⌂</i>Accueil</a>' +
    '<div class="nav-h">Mes cours</div>' +
    COURSES.map(c => '<a href="#/c/' + c.id + '"' + act(p[0] === 'c' && p[1] === c.id) + ' style="--c:' + c.color + '"><i class="ci">' + c.icon + '</i><span class="grow">' + c.title + '</span><span class="pct">' + Math.round(courseProgress(c) * 100) + '%</span></a>').join('') +
    '<div class="nav-h">S\'entraîner</div>' +
    '<a href="#/quiz"' + act(p[0] === 'quiz') + '><i>✓</i><span class="grow">Quiz</span>' + (wr ? '<span class="badge red">' + wr + '</span>' : '') + '</a>' +
    '<a href="#/cartes"' + act(p[0] === 'cartes') + '><i>❏</i><span class="grow">Flashcards</span>' + (due ? '<span class="badge">' + due + '</span>' : '') + '</a>' +
    '<a href="#/formules"' + act(p[0] === 'formules') + '><i>ƒ</i>Formulaire</a>' +
    '<a href="#/recherche"' + act(p[0] === 'recherche') + '><i>⌕</i>Recherche</a></nav>' +
    '<div class="side-foot"><div class="pomo" id="pomo"></div><button class="btn ghost" data-act="theme">' + (S.theme === 'dark' ? '☀ Mode clair' : '☾ Mode sombre') + '</button></div>';
  renderPomo();
}

/* ---------- Composants ---------- */
const bar = (x, col) => '<div class="bar"><div style="width:' + Math.round(x * 100) + '%;' + (col ? 'background:' + col : '') + '"></div></div>';
const pct = x => Math.round(x * 100) + ' %';
function chapStatus(c, ch) {
  const k = chapKey(c, ch), q = S.quiz[k];
  return (S.read[k] ? '<span class="chip ok">Lu</span>' : '<span class="chip">À lire</span>') + (q ? '<span class="chip ' + (q.best >= .8 ? 'ok' : q.best >= .5 ? 'mid' : 'bad') + '">Quiz ' + pct(q.best) + '</span>' : '<span class="chip">Quiz —</span>');
}
function daysLeft(c) { const d = S.exam[c.id]; if (!d) return null; return Math.ceil((new Date(d + 'T00:00:00') - new Date(dayStr() + 'T00:00:00')) / 864e5); }

/* ---------- Accueil ---------- */
function vHome() {
  const chaps = allChaps(), read = chaps.filter(x => S.read[chapKey(x.c, x.ch)]).length;
  const scores = chaps.map(x => S.quiz[chapKey(x.c, x.ch)]).filter(Boolean), avg = scores.length ? scores.reduce((s, q) => s + q.best, 0) / scores.length : 0;
  const cards = chaps.flatMap(x => chapCards(x.c, x.ch)), due = dueCards(cards).length, wr = wrongQs().length;
  const totalQ = chaps.reduce((s, x) => s + x.ch.quiz.length, 0);
  const h = new Date().getHours(), hello = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  // suggestion : premier chapitre non lu, ou plus faible score
  let next = S.last && chaps.find(x => chapKey(x.c, x.ch) === S.last && !S.read[S.last]);
  if (!next) next = chaps.find(x => !S.read[chapKey(x.c, x.ch)]);
  const weak = chaps.filter(x => S.quiz[chapKey(x.c, x.ch)] && S.quiz[chapKey(x.c, x.ch)].best < .7).sort((a, b) => S.quiz[chapKey(a.c, a.ch)].best - S.quiz[chapKey(b.c, b.ch)].best).slice(0, 4);
  const week = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); week.push([['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()], S.days[dayStr(d)] || 0]); }
  const mx = Math.max(1, ...week.map(w => w[1]));
  return '<header class="hero"><div><h1>' + hello + ' 👋</h1><p>Tes 5 cours de première année, résumés et prêts à réviser : ' + chaps.length + ' chapitres, ' + totalQ + ' questions de quiz, ' + cards.length + ' flashcards.</p></div>' +
    '<div class="week" title="Activité des 7 derniers jours">' + week.map(w => '<div><span style="height:' + (6 + 34 * w[1] / mx) + 'px" class="' + (w[1] ? 'on' : '') + '"></span><small>' + w[0] + '</small></div>').join('') + '</div></header>' +
    '<section class="tiles"><div class="tile"><b>' + read + '<small>/' + chaps.length + '</small></b><span>chapitres lus</span></div><div class="tile"><b>' + (scores.length ? pct(avg) : '—') + '</b><span>moyenne aux quiz</span></div><div class="tile"><b>' + due + '</b><span>flashcards à revoir</span></div><div class="tile"><b>' + streak() + '<small> j</small></b><span>jours d\'affilée</span></div></section>' +
    '<section class="actions">' +
    (next ? '<a class="act" href="#/c/' + next.c.id + '/' + next.ch.id + '" style="--c:' + next.c.color + '"><i>▶</i><div><b>' + (S.last === chapKey(next.c, next.ch) ? 'Reprendre la lecture' : 'Prochain chapitre à lire') + '</b><span>' + next.c.title + ' — ' + next.ch.title + '</span></div></a>' : '<div class="act"><i>🎉</i><div><b>Tous les chapitres sont lus</b><span>Continue avec les quiz et les flashcards</span></div></div>') +
    '<button class="act" data-act="daily"><i>❏</i><div><b>Révision du jour</b><span>' + (due ? due + ' carte(s) à revoir + quelques nouvelles' : 'Découvrir de nouvelles flashcards') + '</span></div></button>' +
    '<button class="act" data-act="quiz-mix"><i>⚡</i><div><b>Quiz éclair</b><span>10 questions tirées au hasard dans tous les cours</span></div></button>' +
    (wr ? '<button class="act" data-act="quiz-wrong"><i>↻</i><div><b>Refaire mes erreurs</b><span>' + wr + ' question(s) ratée(s) la dernière fois</span></div></button>' : '') +
    '</section>' +
    '<h2>Mes cours</h2><section class="cgrid">' + COURSES.map(c => { const dl = daysLeft(c); return '<a class="ccard" href="#/c/' + c.id + '" style="--c:' + c.color + '"><div class="cicon">' + c.icon + '</div><h3>' + c.title + '</h3><p>' + c.sub + '</p>' + bar(courseProgress(c)) + '<div class="cmeta"><span>' + c.chapters.length + ' chapitres</span><span>' + pct(courseProgress(c)) + ' maîtrisé</span>' + (dl != null && dl >= 0 ? '<span class="chip mid">Examen J−' + dl + '</span>' : '') + '</div></a>'; }).join('') + '</section>' +
    (weak.length ? '<h2>Points faibles à retravailler</h2><section class="list">' + weak.map(x => '<a class="row" href="#/c/' + x.c.id + '/' + x.ch.id + '" style="--c:' + x.c.color + '"><span class="dot"></span><span class="grow"><b>' + x.ch.title + '</b><small>' + x.c.title + '</small></span>' + chapStatus(x.c, x.ch) + '</a>').join('') + '</section>' : '') +
    '<h2>Comment réviser efficacement</h2><section class="tips"><div><b>1. Lis le résumé</b><p>Manipule les visualisations : une idée qu\'on a vue bouger se retient mieux.</p></div><div><b>2. Teste-toi tout de suite</b><p>Fais le quiz du chapitre sans regarder le cours. Se tromper fait partie de l\'apprentissage.</p></div><div><b>3. Reviens-y plus tard</b><p>Les flashcards reviennent à intervalles croissants (1, 3, 7, 16 jours) : c\'est la répétition espacée.</p></div><div><b>4. Examen blanc</b><p>Avant l\'examen, lance un examen blanc chronométré depuis la page du cours.</p></div></section>';
}

/* ---------- Page d'un cours ---------- */
function vCourse(c) {
  const dl = daysLeft(c), todo = c.chapters.filter(ch => chapProgress(c, ch) < .75).length;
  return '<div class="crumbs"><a href="#/">Accueil</a> › ' + c.title + '</div><header class="chead"><div class="cicon big">' + c.icon + '</div><div class="grow"><h1>' + c.title + '</h1><p>' + c.sub + '</p>' + bar(courseProgress(c)) + '</div></header>' +
    '<section class="actions"><button class="act" data-act="quiz-course" data-c="' + c.id + '"><i>✓</i><div><b>Quiz du cours</b><span>10 questions mélangées, correction immédiate</span></div></button>' +
    '<button class="act" data-act="exam" data-c="' + c.id + '"><i>⏱</i><div><b>Examen blanc</b><span>20 questions chronométrées, correction à la fin' + (S.examBest[c.id] != null ? ' · record ' + pct(S.examBest[c.id]) : '') + '</span></div></button>' +
    '<button class="act" data-act="cards-course" data-c="' + c.id + '"><i>❏</i><div><b>Flashcards du cours</b><span>Cartes à revoir et nouvelles cartes</span></div></button></section>' +
    '<div class="examdate"><label>Date de l\'examen : <input type="date" data-act="examdate" data-c="' + c.id + '" value="' + (S.exam[c.id] || '') + '"></label>' + (dl != null ? (dl >= 0 ? '<span><b>J−' + dl + '</b>' + (todo && dl > 0 ? ' · il reste ' + todo + ' chapitre(s) à consolider, soit environ <b>1 chapitre tous les ' + Math.max(1, Math.floor(dl / todo)) + ' jour(s)</b>' : todo ? ' · ' + todo + ' chapitre(s) à consolider' : ' · tout est consolidé, bravo !') + '</span>' : '<span>Examen passé</span>') : '<span class="muted">Indique la date pour obtenir un rythme de révision.</span>') + '</div>' +
    '<h2>Chapitres</h2><section class="list">' + c.chapters.map(ch => '<a class="row" href="#/c/' + c.id + '/' + ch.id + '"><span class="ring" style="--p:' + Math.round(chapProgress(c, ch) * 100) + '"></span><span class="grow"><b>' + ch.title + '</b><small>' + esc(ch.intro.replace(/\$[^$]*\$/g, '…')).slice(0, 110) + '…</small></span>' + chapStatus(c, ch) + '</a>').join('') + '</section>';
}

/* ---------- Page d'un chapitre ---------- */
function vChapter(c, ch, tab) {
  const k = chapKey(c, ch), idx = c.chapters.indexOf(ch), prev = c.chapters[idx - 1], next = c.chapters[idx + 1];
  S.last = k; save();
  const tabs = [['resume', 'Résumé'], ['formules', 'Formules (' + ch.formulas.length + ')'], ['cartes', 'Flashcards (' + ch.cards.length + ')'], ['quiz', 'Quiz (' + ch.quiz.length + ')'], ['notes', 'Mes notes']];
  let body = '';
  if (tab === 'resume') {
    body = '<p class="intro">' + fmt(ch.intro) + '</p>' +
      (ch.sections.length > 2 ? '<div class="toc">' + ch.sections.map((s, i) => '<a data-act="scroll" data-t="s' + i + '">' + s.title + '</a>').join('') + '</div>' : '') +
      ch.sections.map((s, i) => '<section class="sec" id="s' + i + '"><h2>' + s.title + '</h2>' + renderLines(s.lines) + '</section>').join('') +
      (ch.pitfalls.length ? '<section class="sec"><h2>⚠ Pièges classiques</h2><ul class="pit">' + ch.pitfalls.map(p => '<li>' + fmt(p) + '</li>').join('') + '</ul></section>' : '') +
      '<div class="endbar"><button class="btn ' + (S.read[k] ? 'ghost' : 'primary') + '" data-act="read" data-k="' + k + '">' + (S.read[k] ? '✓ Chapitre lu (annuler)' : '✓ J\'ai lu ce chapitre') + '</button><a class="btn primary" href="#/c/' + c.id + '/' + ch.id + '/quiz">Me tester sur ce chapitre →</a></div>';
  } else if (tab === 'formules') {
    body = '<div class="fgridf">' + ch.formulas.map(f => '<div class="fcard"><span>' + esc(f.name) + '</span><div data-tex="' + esc(f.tex) + '"></div></div>').join('') + '</div>';
  } else if (tab === 'cartes') {
    const list = chapCards(c, ch), known = list.filter(x => (S.cards[cid(c, ch, x.i)] || {}).b >= 2).length;
    body = '<div class="panel center"><h2>' + ch.cards.length + ' flashcards</h2><p>' + known + ' déjà bien connues. Lis la question, réponds dans ta tête, puis retourne la carte.</p><button class="btn primary big" data-act="cards-chap" data-c="' + c.id + '" data-ch="' + ch.id + '">Commencer</button></div>' +
      '<details class="allcards"><summary>Voir toutes les cartes</summary>' + ch.cards.map(x => '<div class="qa"><b>' + fmt(x.q) + '</b><span>' + fmt(x.a) + '</span></div>').join('') + '</details>';
  } else if (tab === 'quiz') {
    const q = S.quiz[k];
    body = '<div class="panel center"><h2>Quiz : ' + ch.title + '</h2><p>' + ch.quiz.length + ' questions à choix multiples, avec explication après chaque réponse.</p>' + (q ? '<p>Meilleur score : <b>' + pct(q.best) + '</b> · dernier : ' + pct(q.last) + ' · ' + q.n + ' tentative(s)</p>' : '<p class="muted">Pas encore tenté.</p>') + '<button class="btn primary big" data-act="quiz-chap" data-c="' + c.id + '" data-ch="' + ch.id + '">' + (q ? 'Recommencer le quiz' : 'Commencer le quiz') + '</button></div>';
  } else {
    body = '<div class="panel"><h2>Mes notes sur ce chapitre</h2><p class="muted">Écris ici ce que tu veux retenir, tes questions pour le prof, tes moyens mnémotechniques… C\'est enregistré automatiquement.</p><textarea class="notes" data-act="notes" data-k="' + k + '" placeholder="Tes notes…">' + esc(S.notes[k] || '') + '</textarea></div>';
  }
  return '<div class="crumbs"><a href="#/">Accueil</a> › <a href="#/c/' + c.id + '">' + c.title + '</a> › ' + ch.title + '</div>' +
    '<header class="chaphead"><h1>' + ch.title + '</h1><div>' + chapStatus(c, ch) + '</div></header>' +
    '<div class="tabs">' + tabs.map(t => '<a href="#/c/' + c.id + '/' + ch.id + '/' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + '</a>').join('') + '</div>' +
    '<article class="chap">' + body + '</article>' +
    '<div class="pn">' + (prev ? '<a href="#/c/' + c.id + '/' + prev.id + '">← ' + prev.title + '</a>' : '<span></span>') + (next ? '<a href="#/c/' + c.id + '/' + next.id + '">' + next.title + ' →</a>' : '<span></span>') + '</div>';
}

/* ---------- Hubs ---------- */
function vQuizHub() {
  const wr = wrongQs().length;
  return '<h1>Quiz</h1><p class="lead">Se tester est la façon la plus efficace d\'apprendre. Choisis un format.</p>' +
    '<section class="actions"><button class="act" data-act="quiz-mix"><i>⚡</i><div><b>Quiz éclair</b><span>10 questions, tous les cours</span></div></button>' +
    '<button class="act" data-act="quiz-wrong"' + (wr ? '' : ' disabled') + '><i>↻</i><div><b>Refaire mes erreurs</b><span>' + (wr ? wr + ' question(s) à corriger' : 'Aucune erreur en attente') + '</span></div></button></section>' +
    COURSES.map(c => '<h2 style="--c:' + c.color + '"><span class="dot"></span> ' + c.title + '</h2><div class="hubrow"><button class="btn" data-act="quiz-course" data-c="' + c.id + '">Quiz du cours (10)</button><button class="btn" data-act="exam" data-c="' + c.id + '">Examen blanc (20, chrono)</button>' + (S.examBest[c.id] != null ? '<span class="muted">Record examen : ' + pct(S.examBest[c.id]) + '</span>' : '') + '</div><section class="list compact">' +
      c.chapters.map(ch => { const q = S.quiz[chapKey(c, ch)]; return '<button class="row" data-act="quiz-chap" data-c="' + c.id + '" data-ch="' + ch.id + '"><span class="grow"><b>' + ch.title + '</b></span><small>' + ch.quiz.length + ' questions</small>' + (q ? '<span class="chip ' + (q.best >= .8 ? 'ok' : q.best >= .5 ? 'mid' : 'bad') + '">' + pct(q.best) + '</span>' : '<span class="chip">—</span>') + '</button>'; }).join('') + '</section>').join('');
}

function vCardsHub() {
  const all = allChaps().flatMap(x => chapCards(x.c, x.ch)), due = dueCards(all).length, seen = all.length - newCards(all).length;
  const boxes = [0, 0, 0, 0, 0]; all.forEach(x => { const s = S.cards[cid(x.c, x.ch, x.i)]; if (s) boxes[Math.min(4, s.b)]++; });
  return '<h1>Flashcards</h1><p class="lead">Répétition espacée : une carte bien sue revient de plus en plus tard (1, 3, 7, 16 jours). Une carte ratée revient tout de suite.</p>' +
    '<section class="tiles"><div class="tile"><b>' + due + '</b><span>à revoir aujourd\'hui</span></div><div class="tile"><b>' + seen + '<small>/' + all.length + '</small></b><span>cartes déjà vues</span></div><div class="tile"><b>' + (boxes[3] + boxes[4]) + '</b><span>cartes maîtrisées</span></div></section>' +
    '<div class="boxes">' + ['À revoir', 'Niveau 1', 'Niveau 2', 'Niveau 3', 'Maîtrisé'].map((l, i) => '<div><span style="height:' + (4 + 60 * boxes[i] / Math.max(1, seen)) + 'px"></span><b>' + boxes[i] + '</b><small>' + l + '</small></div>').join('') + '</div>' +
    '<section class="actions"><button class="act" data-act="daily"><i>❏</i><div><b>Révision du jour</b><span>' + due + ' à revoir + jusqu\'à 10 nouvelles cartes</span></div></button></section>' +
    '<h2>Par cours</h2><section class="list">' + COURSES.map(c => { const l = c.chapters.flatMap(ch => chapCards(c, ch)); return '<button class="row" data-act="cards-course" data-c="' + c.id + '" style="--c:' + c.color + '"><span class="dot"></span><span class="grow"><b>' + c.title + '</b><small>' + l.length + ' cartes · ' + dueCards(l).length + ' à revoir · ' + newCards(l).length + ' nouvelles</small></span><span class="chip">Réviser →</span></button>'; }).join('') + '</section>';
}

function vFormulas() {
  return '<div class="fhead"><div><h1>Formulaire</h1><p class="lead">Toutes les formules des cours, au même endroit.</p></div><div class="ftools"><input type="search" id="ff" placeholder="Filtrer (ex. Taylor, entropie…)" data-act="ffilter"><button class="btn" data-act="print">🖨 Imprimer</button></div></div>' +
    COURSES.map(c => '<div class="fcourse" style="--c:' + c.color + '"><h2><span class="dot"></span> ' + c.title + '</h2>' + c.chapters.map(ch => '<div class="fchap"><h3><a href="#/c/' + c.id + '/' + ch.id + '">' + ch.title + '</a></h3><div class="fgridf">' + ch.formulas.map(f => '<div class="fcard" data-s="' + esc(norm(f.name + ' ' + ch.title + ' ' + c.title)) + '"><span>' + esc(f.name) + '</span><div data-tex="' + esc(f.tex) + '"></div></div>').join('') + '</div></div>').join('') + '</div>').join('');
}

let SEARCH = '';
function vSearch() { return '<h1>Recherche</h1><input type="search" class="bigsearch" placeholder="Un mot-clé : Coriolis, déterminant, entropie, Taylor…" value="' + esc(SEARCH) + '" data-act="search" data-autofocus><div id="sres">' + searchResults(SEARCH) + '</div>'; }
function searchResults(q) {
  q = norm(q.trim()); if (q.length < 2) return '<p class="muted">Tape au moins 2 lettres.</p>';
  const out = [];
  allChaps().forEach(({ c, ch }) => {
    const link = '#/c/' + c.id + '/' + ch.id, tag = '<small style="--c:' + c.color + '"><span class="dot"></span>' + c.title + ' › ' + ch.title + '</small>';
    if (norm(ch.title + ' ' + ch.intro).includes(q)) out.push('<a class="res" href="' + link + '"><b>Chapitre : ' + ch.title + '</b><span>' + fmt(ch.intro) + '</span>' + tag + '</a>');
    ch.sections.forEach(s => { const l = s.lines.find(x => norm(x).includes(q)); if (norm(s.title).includes(q) || l) out.push('<a class="res" href="' + link + '"><b>' + s.title + '</b>' + (l && !l.startsWith('{{') ? '<span>' + fmt(l.replace(/^(- |> |! |ex: )/, '')) + '</span>' : '') + tag + '</a>'); });
    ch.formulas.forEach(f => { if (norm(f.name).includes(q)) out.push('<a class="res" href="' + link + '/formules"><b>Formule : ' + esc(f.name) + '</b><div data-tex="' + esc(f.tex) + '"></div>' + tag + '</a>'); });
    ch.cards.forEach(x => { if (norm(x.q + ' ' + x.a).includes(q)) out.push('<a class="res" href="' + link + '/cartes"><b>' + fmt(x.q) + '</b><span>' + fmt(x.a) + '</span>' + tag + '</a>'); });
  });
  return out.length ? '<p class="muted">' + out.length + ' résultat(s)</p>' + out.slice(0, 60).join('') : '<p class="muted">Aucun résultat.</p>';
}

/* ---------- Quiz ---------- */
function startQuiz(items, opt) {
  if (!items.length) return;
  items = shuffle(items).slice(0, opt.n || items.length);
  SESSION = { type: 'quiz', opt, c: opt.c || null, i: 0, t0: Date.now(), done: false, items: items.map(x => { const q = x.ch.quiz[x.i]; return { ref: x, q, opts: shuffle([{ t: q.ok, ok: 1 }].concat(q.wrong.map(t => ({ t, ok: 0 })))), pick: null }; }) };
  touch(); go('/session');
}
function vQuiz() {
  const s = SESSION, n = s.items.length;
  if (s.done) return vQuizEnd();
  const it = s.items[s.i], ans = it.pick != null && !s.opt.exam;
  return '<div class="sess"><div class="sess-top"><button class="btn ghost small" data-act="quit">✕ Quitter</button><div class="grow">' + bar((s.i + (ans ? 1 : 0)) / n) + '</div><span>' + (s.i + 1) + ' / ' + n + '</span>' + (s.opt.exam ? '<span class="timer" id="timer"></span>' : '') + '</div>' +
    '<div class="qcard"><small style="--c:' + it.ref.c.color + '"><span class="dot"></span>' + it.ref.c.title + ' › ' + it.ref.ch.title + '</small><h2>' + fmt(it.q.q) + '</h2><div class="opts">' +
    it.opts.map((o, j) => '<button class="opt' + (ans ? (o.ok ? ' good' : j === it.pick ? ' bad' : ' dim') : '') + '" data-act="pick" data-j="' + j + '"' + (ans ? ' disabled' : '') + '><kbd>' + (j + 1) + '</kbd><span>' + fmt(o.t) + '</span></button>').join('') + '</div>' +
    (ans ? '<div class="expl ' + (it.opts[it.pick].ok ? 'good' : 'bad') + '"><b>' + (it.opts[it.pick].ok ? '✓ Correct !' : '✗ Pas tout à fait.') + '</b> ' + fmt(it.q.e) + '</div><div class="endbar"><a class="btn ghost" href="#/c/' + it.ref.c.id + '/' + it.ref.ch.id + '" data-act="quit-to">Revoir le chapitre</a><button class="btn primary" data-act="next" data-autofocus>' + (s.i + 1 < n ? 'Question suivante →' : 'Voir mon résultat →') + '</button></div>' : '<p class="hint">Astuce : touches 1 à ' + it.opts.length + ' pour répondre, Entrée pour continuer.</p>') + '</div></div>';
}
function pick(j) {
  const s = SESSION, it = s.items[s.i]; if (it.pick != null && !s.opt.exam) return;
  it.pick = j; const ok = it.opts[j].ok, k = qid(it.ref.c, it.ref.ch, it.ref.i), st = S.q[k] || { n: 0, ok: 0 };
  st.n++; st.ok += ok; st.last = ok; S.q[k] = st; save();
  if (s.opt.exam) nextQ(); else render();
}
function nextQ() {
  const s = SESSION; if (s.i + 1 < s.items.length) { s.i++; render(); $('#main').scrollTop = 0; return; }
  s.done = true; s.time = Math.round((Date.now() - s.t0) / 1000);
  const sc = s.items.filter(x => x.pick != null && x.opts[x.pick].ok).length / s.items.length; s.score = sc;
  if (s.opt.scope === 'chap') { const k = chapKey(s.opt.c, s.opt.ch), q = S.quiz[k] || { best: 0, n: 0 }; q.best = Math.max(q.best, sc); q.last = sc; q.n++; S.quiz[k] = q; }
  if (s.opt.exam) S.examBest[s.opt.c.id] = Math.max(S.examBest[s.opt.c.id] || 0, sc);
  touch(s.items.length); render(); $('#main').scrollTop = 0;
}
function vQuizEnd() {
  const s = SESSION, good = s.items.filter(x => x.pick != null && x.opts[x.pick].ok).length, n = s.items.length, sc = good / n, bad = s.items.filter(x => !(x.pick != null && x.opts[x.pick].ok));
  const msg = sc === 1 ? 'Parfait ! 🎯' : sc >= .8 ? 'Très bien ! 💪' : sc >= .5 ? 'Pas mal, encore un effort.' : 'Ce chapitre mérite une relecture.';
  return '<div class="sess"><div class="panel center result"><div class="score" style="--p:' + Math.round(sc * 100) + '"><b>' + good + '/' + n + '</b></div><h2>' + msg + '</h2><p>' + pct(sc) + ' de bonnes réponses' + (s.opt.exam ? ' · temps : ' + Math.floor(s.time / 60) + ' min ' + (s.time % 60) + ' s' : '') + '</p>' +
    '<div class="endbar center">' + (bad.length ? '<button class="btn primary" data-act="redo-bad">Refaire les ' + bad.length + ' erreur(s)</button>' : '') + '<button class="btn" data-act="redo">Recommencer</button><button class="btn ghost" data-act="quit">Terminer</button></div></div>' +
    '<h2>Correction</h2>' + s.items.map((it, i) => { const ok = it.pick != null && it.opts[it.pick].ok; return '<div class="rev ' + (ok ? 'good' : 'bad') + '"><b>' + (i + 1) + '. ' + fmt(it.q.q) + '</b>' + (ok ? '' : '<p class="yours">Ta réponse : ' + (it.pick != null ? fmt(it.opts[it.pick].t) : '—') + '</p>') + '<p class="right">Bonne réponse : ' + fmt(it.q.ok) + '</p><p class="why">' + fmt(it.q.e) + '</p><a href="#/c/' + it.ref.c.id + '/' + it.ref.ch.id + '">' + it.ref.c.title + ' › ' + it.ref.ch.title + '</a></div>'; }).join('') + '</div>';
}

/* ---------- Flashcards ---------- */
function startCards(list, opt) {
  if (!list.length) return;
  SESSION = { type: 'cards', opt: opt || {}, c: (opt && opt.c) || null, queue: list.slice(), total: list.length, seen: 0, again: 0, flip: false, done: false };
  touch(); go('/session');
}
function pickCards(list, maxNew) { return shuffle(dueCards(list)).concat(shuffle(newCards(list)).slice(0, maxNew)); }
function vCards() {
  const s = SESSION;
  if (s.done || !s.queue.length) return '<div class="sess"><div class="panel center result"><div class="bigemoji">🎉</div><h2>Session terminée</h2><p>' + s.seen + ' carte(s) révisée(s)' + (s.again ? ', dont ' + s.again + ' à retravailler' : '') + '. Elles reviendront automatiquement au bon moment.</p><div class="endbar center"><button class="btn primary" data-act="quit">Terminer</button></div></div></div>';
  const x = s.queue[0], card = x.ch.cards[x.i], st = S.cards[cid(x.c, x.ch, x.i)];
  return '<div class="sess"><div class="sess-top"><button class="btn ghost small" data-act="quit">✕ Quitter</button><div class="grow">' + bar(1 - s.queue.length / Math.max(s.total, s.queue.length)) + '</div><span>' + s.queue.length + ' restante(s)</span></div>' +
    '<div class="flash' + (s.flip ? ' flipped' : '') + '" data-act="flip" style="--c:' + x.c.color + '"><small><span class="dot"></span>' + x.c.title + ' › ' + x.ch.title + (st ? '' : ' · <b>nouvelle</b>') + '</small><div class="fq">' + fmt(card.q) + '</div>' + (s.flip ? '<hr><div class="fa">' + fmt(card.a) + '</div>' : '<div class="fhint">Réponds dans ta tête, puis clique (ou Espace) pour voir la réponse</div>') + '</div>' +
    (s.flip ? '<div class="rate"><button class="btn bad" data-act="rate" data-r="0"><kbd>1</kbd> À revoir</button><button class="btn mid" data-act="rate" data-r="1"><kbd>2</kbd> Difficile</button><button class="btn good" data-act="rate" data-r="2"><kbd>3</kbd> Je savais</button></div>' : '<div class="rate"><button class="btn primary big" data-act="flip" data-autofocus>Afficher la réponse</button></div>') + '</div>';
}
function rate(r) {
  const s = SESSION, x = s.queue.shift(), k = cid(x.c, x.ch, x.i), st = S.cards[k] || { b: 0, d: 0 }, IV = [0, 1, 3, 7, 16], t = dayNum();
  if (r === 0) { st.b = 0; st.d = t; s.queue.push(x); s.again++; }
  else if (r === 1) { st.b = Math.max(1, st.b); st.d = t + 1; s.seen++; }
  else { st.b = Math.min(4, st.b + 1); st.d = t + IV[st.b]; s.seen++; }
  S.cards[k] = st; save(); s.flip = false; if (!s.queue.length) { s.done = true; touch(s.seen); } render();
}

/* ---------- Minuteur Pomodoro ---------- */
const POMO = { left: 25 * 60, run: false, mode: 'work', iv: 0 };
function renderPomo() {
  const el = $('#pomo'); if (!el) return;
  const m = Math.floor(POMO.left / 60), s = POMO.left % 60;
  el.innerHTML = '<div><small>' + (POMO.mode === 'work' ? 'Concentration' : 'Pause') + '</small><b>' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '</b></div><button class="btn small" data-act="pomo">' + (POMO.run ? '❚❚' : '▶') + '</button><button class="btn small ghost" data-act="pomo-reset" title="Réinitialiser">↺</button>';
}
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 660; g.gain.setValueAtTime(.2, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + 1); o.start(); o.stop(a.currentTime + 1); } catch (e) { } }
function pomoToggle() {
  POMO.run = !POMO.run; clearInterval(POMO.iv);
  if (POMO.run) POMO.iv = setInterval(() => { POMO.left--; if (POMO.left <= 0) { beep(); POMO.mode = POMO.mode === 'work' ? 'break' : 'work'; POMO.left = (POMO.mode === 'work' ? 25 : 5) * 60; } renderPomo(); }, 1000);
  renderPomo();
}
setInterval(() => { const t = $('#timer'); if (t && SESSION && !SESSION.done) { const s = Math.round((Date.now() - SESSION.t0) / 1000); t.textContent = '⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); } }, 500);

/* ---------- Événements ---------- */
const allQs = () => allChaps().flatMap(x => chapQs(x.c, x.ch));
const allCards = () => allChaps().flatMap(x => chapCards(x.c, x.ch));
const ACT = {
  theme() { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); render(); },
  read(d) { if (S.read[d.k]) delete S.read[d.k]; else { S.read[d.k] = 1; touch(); } save(); render(); },
  scroll(d) { const e = document.getElementById(d.t); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  daily() { const l = pickCards(allCards(), 10); startCards(l.length ? l : shuffle(allCards()).slice(0, 15)); },
  'quiz-mix'() { startQuiz(allQs(), { n: 10 }); },
  'quiz-wrong'() { startQuiz(wrongQs(), { n: 20 }); },
  'quiz-course'(d) { const c = course(d.c); startQuiz(c.chapters.flatMap(ch => chapQs(c, ch)), { n: 10, c }); },
  exam(d) { const c = course(d.c); startQuiz(c.chapters.flatMap(ch => chapQs(c, ch)), { n: 20, c, exam: true }); },
  'quiz-chap'(d) { const c = course(d.c), ch = c.chapters.find(x => x.id === d.ch); startQuiz(chapQs(c, ch), { c, ch, scope: 'chap' }); },
  'cards-course'(d) { const c = course(d.c), all = c.chapters.flatMap(ch => chapCards(c, ch)), l = pickCards(all, 15); startCards(l.length ? l : shuffle(all).slice(0, 20), { c }); },
  'cards-chap'(d) { const c = course(d.c), ch = c.chapters.find(x => x.id === d.ch); startCards(shuffle(chapCards(c, ch)), { c }); },
  pick(d) { pick(+d.j); }, next() { nextQ(); },
  quit() { const s = SESSION; SESSION = null; go(s && s.opt && s.opt.ch ? '/c/' + s.opt.c.id + '/' + s.opt.ch.id + '/quiz' : s && s.c ? '/c/' + s.c.id : '/'); },
  'quit-to'() { SESSION = null; },
  redo() { const s = SESSION; startQuiz(s.items.map(x => x.ref), s.opt); },
  'redo-bad'() { const s = SESSION; startQuiz(s.items.filter(x => !(x.pick != null && x.opts[x.pick].ok)).map(x => x.ref), Object.assign({}, s.opt, { scope: null, exam: false, n: 0 })); },
  flip() { if (SESSION && !SESSION.flip) { SESSION.flip = true; render(); } },
  rate(d) { rate(+d.r); },
  pomo() { pomoToggle(); }, 'pomo-reset'() { clearInterval(POMO.iv); POMO.run = false; POMO.mode = 'work'; POMO.left = 25 * 60; renderPomo(); },
  print() { window.print(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
  const f = ACT[el.dataset.act]; if (f) { if (el.tagName !== 'A') e.preventDefault(); f(el.dataset, el); }
});
document.addEventListener('input', e => {
  const el = e.target, a = el.dataset && el.dataset.act;
  if (a === 'notes') { S.notes[el.dataset.k] = el.value; save(); }
  else if (a === 'search') { SEARCH = el.value; const r = $('#sres'); r.innerHTML = searchResults(SEARCH); typeset(r); }
  else if (a === 'ffilter') { const q = norm(el.value.trim()); view.querySelectorAll('.fcard').forEach(n => n.style.display = !q || n.dataset.s.includes(q) ? '' : 'none'); view.querySelectorAll('.fchap').forEach(n => n.style.display = [...n.querySelectorAll('.fcard')].some(x => x.style.display !== 'none') ? '' : 'none'); view.querySelectorAll('.fcourse').forEach(n => n.style.display = [...n.querySelectorAll('.fchap')].some(x => x.style.display !== 'none') ? '' : 'none'); }
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.act === 'examdate') { if (el.value) S.exam[el.dataset.c] = el.value; else delete S.exam[el.dataset.c]; save(); render(); } });
document.addEventListener('keydown', e => {
  if (!SESSION || !location.hash.startsWith('#/session') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const s = SESSION;
  if (s.type === 'quiz' && !s.done) {
    const it = s.items[s.i], n = +e.key;
    if (n >= 1 && n <= it.opts.length && (it.pick == null || s.opt.exam)) { e.preventDefault(); pick(n - 1); }
    else if (e.key === 'Enter' && it.pick != null && !s.opt.exam) { e.preventDefault(); nextQ(); }
  } else if (s.type === 'cards' && !s.done && s.queue.length) {
    if (!s.flip && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); ACT.flip(); }
    else if (s.flip && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); rate(+e.key - 1); }
  }
});
function applyTheme() { document.documentElement.dataset.theme = S.theme; }
applyTheme(); render();
