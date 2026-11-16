import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

// Révise est encore un script classique : on le charge dans un contexte isolé.
function loadRevise(files) {
  const ctx = vm.createContext({ console });
  for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  return ctx;
}
const core = loadRevise(['revise/app/core.js']);

describe('Révise : analyseur de cours', () => {
  const chapters = core.parseCourse([
    '@chapter kepler | Lois de Kepler',
    '@intro Trois lois pour le mouvement des planètes.',
    '@section Première loi',
    '- Les orbites sont des **ellipses**.',
    '> Le Soleil occupe un foyer.',
    '{{viz:orbite}}',
    '@formulas',
    'Troisième loi :: T^2=\\frac{4\\pi^2}{GM}a^3',
    '@pitfalls',
    '- Confondre demi-grand axe et rayon.',
    '@cards',
    'Que vaut $T^2/a^3$ ? :: Une constante, $4\\pi^2/GM$.',
    '@quiz',
    '? Si $a$ double, $T$ est multiplié par',
    '+ $2\\sqrt 2$',
    '- 2',
    '- 4',
    '= $T \\propto a^{3/2}$.',
  ].join('\n'));

  it('lit chapitres, sections, formules, pièges, cartes et quiz', () => {
    expect(chapters).toHaveLength(1);
    const ch = chapters[0];
    expect(ch).toMatchObject({ id: 'kepler', title: 'Lois de Kepler', intro: 'Trois lois pour le mouvement des planètes.' });
    expect(ch.sections[0].lines).toHaveLength(3);
    expect(ch.formulas[0]).toEqual({ name: 'Troisième loi', tex: 'T^2=\\frac{4\\pi^2}{GM}a^3' });
    expect(ch.pitfalls).toEqual(['Confondre demi-grand axe et rayon.']);
    expect(ch.cards[0].a).toBe('Une constante, $4\\pi^2/GM$.');
    expect(ch.quiz[0]).toMatchObject({ ok: '$2\\sqrt 2$', wrong: ['2', '4'], e: '$T \\propto a^{3/2}$.' });
  });
  it('met en forme le gras, protège les maths et échappe le HTML', () => {
    expect(core.fmt('**a** < b et $x<y$')).toBe('<b>a</b> &lt; b et $x&lt;y$');
    expect(core.renderLines(['{{viz:orbite}}'])).toBe('<div class="viz" data-viz="orbite"></div>');
    expect(core.renderLines(['- un', '- deux', 'fin'])).toBe('<ul><li>un</li><li>deux</li></ul><p>fin</p>');
  });
});

describe('Révise : contenu livré', () => {
  const names = ['methodes', 'analyse', 'algebre', 'mecanique', 'physmac'];
  const all = loadRevise(['revise/app/core.js', ...names.map(n => 'revise/app/data/' + n + '.js')]);
  const courses = vm.runInContext('COURSES', all);
  const vizNames = [...fs.readFileSync('revise/app/viz.js', 'utf8').matchAll(/^VIZ\.(\w+) = /gm)].map(m => m[1]);

  it('charge les 5 cours et leurs 33 chapitres', () => {
    expect(courses.map(c => c.id).sort()).toEqual([...names].sort());
    expect(courses.reduce((s, c) => s + c.chapters.length, 0)).toBe(33);
  });
  it('chaque question a une bonne réponse, au moins une mauvaise et une explication', () => {
    const bad = [];
    for (const c of courses) for (const ch of c.chapters) ch.quiz.forEach((q, i) => {
      if (!q.q || !q.ok || !q.wrong.length || !q.e) bad.push(c.id + '/' + ch.id + '#' + i);
      if (q.wrong.includes(q.ok)) bad.push(c.id + '/' + ch.id + '#' + i + ' (doublon)');
    });
    expect(bad).toEqual([]);
  });
  it('chaque formule et chaque carte est complète', () => {
    const bad = [];
    for (const c of courses) for (const ch of c.chapters) {
      ch.formulas.forEach((f, i) => { if (!f.name || !f.tex) bad.push(c.id + '/' + ch.id + ' formule ' + i); });
      ch.cards.forEach((k, i) => { if (!k.q || !k.a) bad.push(c.id + '/' + ch.id + ' carte ' + i); });
    }
    expect(bad).toEqual([]);
  });
  it('chaque simulation citée dans un cours existe', () => {
    const missing = [];
    for (const c of courses) for (const ch of c.chapters) for (const s of ch.sections) for (const l of s.lines) {
      const m = l.match(/^\{\{viz:(\w+)\}\}$/); if (m && !vizNames.includes(m[1])) missing.push(m[1]);
    }
    expect(missing).toEqual([]);
  });
});
