/* Format des sauvegardes (.zip), indépendant du stockage et de l'interface.

   replay.json     {app:'replay', v:4, at, settings, problems:{id: problème}}
   images/<clé>    photos du carnet d'erreurs
   notes.json      {nodes:[…], docs:{idNote: document}}
   blobs/<clé>     fichiers des notes (pages PDF, images, vignettes)
   manifest.json   {v:4, at, counts:{…}, types:{nomDeFichier: typeMIME}}

   Les versions 3 (zip sans manifeste) et 1 (.json seul) restent lisibles. */
import { buildZip, readZip } from './zip.js';

export const BACKUP_VERSION = 4;
const IMG_FIELDS = ['problemImg', 'solutionImg', 'noteImg'];
export const imageRefs = problems => { const s = new Set(); for (const p of problems) for (const k of IMG_FIELDS) if (p[k] && String(p[k]).startsWith('idb:')) s.add(p[k]); return s; };

/* src : {settings, problems:[…], images:[[clé, Blob]], nodes:[…], docs:{…}, blobs:[[clé, Blob]]} */
export async function buildBackup(src, onProgress){
  const entries = [], types = {};
  const problems = Object.fromEntries(src.problems.map(p => [p.id, p]));
  entries.push({ name: 'replay.json', data: JSON.stringify({ app: 'replay', v: BACKUP_VERSION, at: new Date().toISOString(), settings: src.settings, problems }) });
  for (const [k, b] of src.images || []) { const n = 'images/' + encodeURIComponent(k); entries.push({ name: n, data: b }); if (b.type) types[n] = b.type; }
  entries.push({ name: 'notes.json', data: JSON.stringify({ nodes: src.nodes || [], docs: src.docs || {} }) });
  for (const [k, b] of src.blobs || []) { const n = 'blobs/' + encodeURIComponent(k); entries.push({ name: n, data: b }); if (b.type) types[n] = b.type; }
  const counts = { problems: src.problems.length, images: (src.images || []).length, nodes: (src.nodes || []).length, docs: Object.keys(src.docs || {}).length, blobs: (src.blobs || []).length };
  entries.push({ name: 'manifest.json', data: JSON.stringify({ v: BACKUP_VERSION, at: new Date().toISOString(), counts, types }) });
  return { blob: await buildZip(entries, onProgress), counts };
}

const guessType = name => name.startsWith('blobs/pdf%3A') ? 'application/pdf' : name.startsWith('blobs/') || name.startsWith('images/') ? 'image/jpeg' : '';

/* Ouvre et CONTRÔLE une sauvegarde sans rien écrire. Lève une erreur lisible si elle est inutilisable.
   Renvoie {version, settings, problems:[…], imageKeys, hasNotes, nodes, docs, blobKeys, image(k), blob(k), counts, missing}. */
export async function openBackup(file){
  const zip = await readZip(file);
  if (!zip.has('replay.json')) throw new Error('ce fichier n’est pas une sauvegarde Replay');
  let o; try { o = JSON.parse(await zip.text('replay.json')); } catch (e) { throw new Error('sauvegarde abîmée (carnet illisible)'); }
  if (!o || o.app !== 'replay' || typeof o.problems !== 'object' || !o.problems) throw new Error('ce fichier n’est pas une sauvegarde Replay');
  const problems = Object.entries(o.problems).filter(([, v]) => v && typeof v === 'object').map(([k, v]) => Object.assign({}, v, { id: v.id || k }));
  let manifest = null;
  if (zip.has('manifest.json')) { try { manifest = JSON.parse(await zip.text('manifest.json')); } catch (e) { throw new Error('sauvegarde abîmée (manifeste illisible)'); } }
  const types = (manifest && manifest.types) || {};
  const typeOf = n => types[n] || guessType(n);
  const hasNotes = zip.has('notes.json'); let nodes = [], docs = {};
  if (hasNotes) {
    let nj; try { nj = JSON.parse(await zip.text('notes.json')); } catch (e) { throw new Error('sauvegarde abîmée (cours illisibles)'); }
    nodes = Array.isArray(nj.nodes) ? nj.nodes : []; docs = nj.docs && typeof nj.docs === 'object' ? nj.docs : {};
    if (nodes.some(n => !n || !n.id)) throw new Error('sauvegarde abîmée (note sans identifiant)');
  }
  const imageKeys = zip.names.filter(n => n.startsWith('images/')).map(n => decodeURIComponent(n.slice(7)));
  const blobKeys = zip.names.filter(n => n.startsWith('blobs/')).map(n => decodeURIComponent(n.slice(6)));
  const counts = { problems: problems.length, images: imageKeys.length, nodes: nodes.length, docs: Object.keys(docs).length, blobs: blobKeys.length };
  if (manifest && manifest.counts) for (const k of Object.keys(counts))
    if (manifest.counts[k] !== counts[k]) throw new Error('sauvegarde incomplète : ' + counts[k] + ' ' + k + ' au lieu de ' + manifest.counts[k]);
  // fichiers référencés mais absents de l'archive (signalés, non bloquants)
  const haveImg = new Set(imageKeys), haveBlob = new Set(blobKeys); const missing = [];
  for (const r of imageRefs(problems)) if (!haveImg.has(r)) missing.push(r);
  for (const d of Object.values(docs)) for (const it of (d && d.items) || []) for (const f of ['img', 'lo', 'blob', 'pdf']) if (it[f] && !haveBlob.has(it[f])) missing.push(it[f]);
  return {
    version: o.v || 1, at: o.at || null, settings: o.settings || {}, problems, imageKeys, hasNotes, nodes, docs, blobKeys, counts, missing,
    image: k => zip.blob('images/' + encodeURIComponent(k), typeOf('images/' + encodeURIComponent(k))),
    blob: k => zip.blob('blobs/' + encodeURIComponent(k), typeOf('blobs/' + encodeURIComponent(k))),
    check: async () => { for (const n of zip.names) if (!(await zip.check(n))) throw new Error('sauvegarde abîmée : ' + n); return true; },
  };
}

/* Ancien format : un seul fichier .json avec les images en data: URL. */
export function parseLegacyJson(text){
  let o; try { o = JSON.parse(text); } catch (e) { throw new Error('fichier illisible'); }
  if (!o || o.app !== 'replay' || typeof o.problems !== 'object' || !o.problems) throw new Error('ce fichier n’est pas une sauvegarde Replay');
  const problems = Object.entries(o.problems).filter(([, v]) => v && typeof v === 'object').map(([k, v]) => Object.assign({}, v, { id: v.id || k }));
  return { settings: o.settings || {}, problems, images: o.images && typeof o.images === 'object' ? o.images : {} };
}
