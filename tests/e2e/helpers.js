// Simule une tablette qui a les données de l'ancienne version (Replay v4) puis reçoit la mise à jour.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export async function seedV4(page) {
  await page.goto('/app.css'); // page vide de même origine : l'appli n'y tourne pas
  await page.evaluate(async (png) => {
    const bin = atob(png); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/png' });
    for (const name of ['replay-carnet', 'replay-images', 'replay-notes']) await new Promise(r => { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = () => r(); });
    localStorage.clear();
    await new Promise((res, rej) => { const r = indexedDB.open('replay-images', 1); r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => { const t = r.result.transaction('img', 'readwrite'); t.objectStore('img').put(blob, 'idb:img1'); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); });
    await new Promise((res, rej) => { const r = indexedDB.open('replay-notes', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('nodes', { keyPath: 'id' }); d.createObjectStore('docs'); d.createObjectStore('blobs'); };
      r.onsuccess = () => { const t = r.result.transaction(['nodes', 'docs'], 'readwrite');
        t.objectStore('nodes').put({ id: 'n1', type: 'note', parent: 'c:Mécanique I', name: 'Cours du 3 novembre', created: '2026-11-03', createdAt: 1, updated: 2, stamps: [{ id: 's1', t: 'q', done: false, x: 100, y: 100 }], mode: 'pages', pages: 1 });
        t.objectStore('docs').put({ v: 2, mode: 'pages', tpl: 'grid', view: null, strokes: [{ id: 'k1', tool: 'pen', pen: 'fountain', color: '#1d2fa0', size: 2.4, pts: [100, 100, 0.5, 200, 150, 0.6, 300, 120, 0.5] }], items: [{ id: 'pg1', kind: 'page', x: 0, y: 0, w: 1000, h: 1414, tpl: 'grid' }, { id: 's1', kind: 'stamp', stamp: 'q', x: 100, y: 100, done: false }] }, 'n1');
        t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); });
    localStorage.setItem('replay-notebook-v1', JSON.stringify({
      settings: { dailyLimit: 2, examLimit: 3, boostDays: 7, reviewMode: 'full', penOnly: true, customTopics: { 'Mécanique I': ['Marées'] }, extraCourses: ['Physique numérique'], exams: [], tasks: [{ id: 't1', title: 'Série 6', course: 'Algèbre', type: 'serie', due: '2026-11-20', done: false }] },
      problems: {
        pa: { id: 'pa', created: '2026-11-01', createdAt: 1, course: 'Mécanique I', topics: ['Gravitation & Kepler'], reasons: ['concept'], source: 'Série 5, ex. 2', problemImg: 'idb:img1', problemText: 'Période d’un satellite géostationnaire', solutionText: '$T^2 = 4\\pi^2 a^3 / GM$', noteText: null, srs: { ease: 2.1, interval: 1, reps: 0, lapses: 1, due: '2026-11-02', last: '2026-11-01' }, history: [{ d: '2026-11-01', r: 'again', m: 'quick' }], archived: false },
        pb: { id: 'pb', created: '2026-11-05', createdAt: 2, course: 'Thermodynamics I', topic: 'Gaz parfait', reasons: [], problemText: 'Détente isotherme', srs: { ease: 2.3, interval: 30, reps: 3, lapses: 0, due: '2099-01-01', last: '2026-11-05' }, history: [], archived: true },
      },
    }));
  }, PNG);
}
