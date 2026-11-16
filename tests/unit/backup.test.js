import { describe, it, expect } from 'vitest';
import { crc32, buildZip, readZip } from '../../web/src/core/zip.js';
import { buildBackup, openBackup, parseLegacyJson, imageRefs } from '../../web/src/core/backup-format.js';

const bytes = (n, seed = 1) => { const a = new Uint8Array(n); let x = seed; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) >>> 0; a[i] = x >>> 24; } return a; };
const same = async (blob, arr) => { const b = new Uint8Array(await blob.arrayBuffer()); return b.length === arr.length && b.every((v, i) => v === arr[i]); };

describe('zip', () => {
  it('calcule le CRC-32 standard, y compris par morceaux', () => {
    const t = new TextEncoder().encode('123456789');
    expect(crc32(t)).toBe(0xCBF43926);
    expect(crc32(t.subarray(4), crc32(t.subarray(0, 4)))).toBe(0xCBF43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
  it('écrit puis relit des fichiers texte, binaires, vides et aux noms accentués', async () => {
    const big = bytes(300000, 7);
    const zip = await buildZip([
      { name: 'replay.json', data: '{"é":"ça marche — ✓"}' },
      { name: 'blobs/pdf%3Aabc', data: new Blob([big], { type: 'application/pdf' }) },
      { name: 'vide', data: new Uint8Array(0) },
      { name: 'images/énoncé 1.jpg', data: bytes(10, 3) },
    ]);
    const z = await readZip(zip);
    expect(z.names).toEqual(['replay.json', 'blobs/pdf%3Aabc', 'vide', 'images/énoncé 1.jpg']);
    expect(await z.text('replay.json')).toBe('{"é":"ça marche — ✓"}');
    expect(await same(await z.blob('blobs/pdf%3Aabc'), big)).toBe(true);
    expect((await z.blob('blobs/pdf%3Aabc', 'application/pdf')).type).toBe('application/pdf');
    expect((await z.blob('vide')).size).toBe(0);
    for (const n of z.names) expect(await z.check(n)).toBe(true);
  });
  it('détecte un fichier altéré, une archive tronquée et un fichier qui n’est pas un zip', async () => {
    const zip = await buildZip([{ name: 'a.bin', data: bytes(5000, 2) }, { name: 'b.txt', data: 'bonjour' }]);
    const raw = new Uint8Array(await zip.arrayBuffer());
    const bad = raw.slice(); bad[200] ^= 0xFF;
    expect(await (await readZip(new Blob([bad]))).check('a.bin')).toBe(false);
    await expect(readZip(new Blob([raw.subarray(0, raw.length - 40)]))).rejects.toThrow();
    await expect(readZip(new Blob(['ceci n’est pas une archive']))).rejects.toThrow();
  });
  it('signale un fichier demandé mais absent', async () => {
    const z = await readZip(await buildZip([{ name: 'a', data: 'x' }]));
    await expect(z.blob('b')).rejects.toThrow('absent');
  });
});

const sample = () => ({
  settings: { dailyLimit: 3, exams: [{ id: 'e', name: 'Contrôle', date: '2026-12-01', course: 'Mécanique I' }] },
  problems: [
    { id: 'p1', course: 'Mécanique I', problemImg: 'idb:a', solutionImg: 'idb:b', history: [{ d: '2026-11-01', r: 'good' }] },
    { id: 'p2', course: 'Analyse', problemText: 'Limite de $\\sin x / x$', noteImg: 'data:image/png;base64,AAAA' },
  ],
  images: [['idb:a', new Blob([bytes(2000, 1)], { type: 'image/jpeg' })], ['idb:b', new Blob([bytes(900, 2)], { type: 'image/png' })]],
  nodes: [{ id: 'f1', type: 'folder', parent: 'c:Mécanique I', name: 'Chapitre 3' }, { id: 'n1', type: 'note', parent: 'f1', name: 'Kepler' }],
  docs: { n1: { v: 2, mode: 'pages', strokes: [{ id: 's', pts: [1, 2, 0.5] }], items: [{ id: 'pg', kind: 'page', img: 'b:1', lo: 'lo:1', pdf: 'pdf:1', pi: 1 }] } },
  blobs: [['b:1', new Blob([bytes(5000, 4)], { type: 'image/jpeg' })], ['lo:1', new Blob([bytes(300, 5)], { type: 'image/jpeg' })], ['pdf:1', new Blob([bytes(8000, 6)], { type: 'application/pdf' })]],
});

describe('format de sauvegarde', () => {
  it('aller-retour complet : rien ne manque, rien ne change', async () => {
    const src = sample(); const { blob, counts } = await buildBackup(src);
    expect(counts).toEqual({ problems: 2, images: 2, nodes: 2, docs: 1, blobs: 3 });
    const b = await openBackup(blob);
    expect(b.version).toBe(4); expect(b.counts).toEqual(counts); expect(b.missing).toEqual([]);
    expect(b.settings).toEqual(src.settings);
    expect(b.problems).toEqual(src.problems);
    expect(b.nodes).toEqual(src.nodes); expect(b.docs).toEqual(src.docs);
    expect(b.imageKeys.sort()).toEqual(['idb:a', 'idb:b']);
    expect(b.blobKeys.sort()).toEqual(['b:1', 'lo:1', 'pdf:1']);
    const img = await b.image('idb:b'); expect(img.type).toBe('image/png'); expect(await same(img, bytes(900, 2))).toBe(true);
    const pdf = await b.blob('pdf:1'); expect(pdf.type).toBe('application/pdf'); expect(await same(pdf, bytes(8000, 6))).toBe(true);
    expect(await b.check()).toBe(true);
  });
  it('refuse une sauvegarde dont le contenu ne correspond pas au manifeste', async () => {
    const src = sample(); const full = await buildBackup(src);
    const z = await readZip(full.blob);
    const entries = [];
    for (const n of z.names) if (n !== 'blobs/pdf%3A1') entries.push({ name: n, data: await z.blob(n) });
    await expect(openBackup(await buildZip(entries))).rejects.toThrow('incomplète');
  });
  it('refuse un zip quelconque et un carnet illisible', async () => {
    await expect(openBackup(await buildZip([{ name: 'photo.jpg', data: 'x' }]))).rejects.toThrow('pas une sauvegarde Replay');
    await expect(openBackup(await buildZip([{ name: 'replay.json', data: '{"app":"replay","problems":{' }]))).rejects.toThrow('abîmée');
    await expect(openBackup(await buildZip([{ name: 'replay.json', data: '{"app":"autre","problems":{}}' }]))).rejects.toThrow('pas une sauvegarde Replay');
  });
  it('lit une sauvegarde de l’ancienne version 3 (sans manifeste) et signale les fichiers manquants', async () => {
    const old = await buildZip([
      { name: 'replay.json', data: JSON.stringify({ app: 'replay', v: 3, settings: { dailyLimit: 1 }, problems: { p1: { id: 'p1', problemImg: 'idb:a' }, p2: { course: 'Algèbre', solutionImg: 'idb:zz' } } }) },
      { name: 'images/idb%3Aa', data: bytes(50) },
      { name: 'notes.json', data: JSON.stringify({ nodes: [{ id: 'n1', type: 'note' }], docs: { n1: { items: [{ kind: 'page', img: 'b:9' }] } } }) },
      { name: 'blobs/pdf%3Ak', data: bytes(70) },
    ]);
    const b = await openBackup(old);
    expect(b.version).toBe(3); expect(b.problems.map(p => p.id)).toEqual(['p1', 'p2']);
    expect(b.missing.sort()).toEqual(['b:9', 'idb:zz']);
    expect((await b.image('idb:a')).type).toBe('image/jpeg');
    expect((await b.blob('pdf:k')).type).toBe('application/pdf');
  });
  it('un zip sans notes.json ne touche pas aux cours', async () => {
    const b = await openBackup(await buildZip([{ name: 'replay.json', data: JSON.stringify({ app: 'replay', problems: {} }) }]));
    expect(b.hasNotes).toBe(false);
  });
  it('lit l’ancien format .json', () => {
    const r = parseLegacyJson(JSON.stringify({ app: 'replay', v: 1, settings: { dailyLimit: 2 }, problems: { a: { course: 'Analyse' } }, images: { 'idb:x': 'data:image/png;base64,AAAA' } }));
    expect(r.problems).toEqual([{ course: 'Analyse', id: 'a' }]);
    expect(Object.keys(r.images)).toEqual(['idb:x']);
    expect(() => parseLegacyJson('{"app":"x"}')).toThrow();
    expect(() => parseLegacyJson('pas du json')).toThrow();
  });
  it('recense les images référencées par le carnet', () => {
    expect([...imageRefs(sample().problems)].sort()).toEqual(['idb:a', 'idb:b']);
  });
});
