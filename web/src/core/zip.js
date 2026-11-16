/* Archives zip sans dépendance, pensées pour les grosses sauvegardes :
   - écriture : les fichiers sont référencés (Blob de Blobs), jamais recopiés en mémoire ;
   - lecture : seul l'index est lu, chaque fichier est extrait à la demande par Blob.slice. */

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(bytes, crc = 0){
  let c = ~crc >>> 0;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return ~c >>> 0;
}
const CHUNK = 4 * 1024 * 1024;
export async function blobCrc32(blob){
  let crc = 0;
  for (let i = 0; i < blob.size; i += CHUNK) crc = crc32(new Uint8Array(await blob.slice(i, i + CHUNK).arrayBuffer()), crc);
  return crc;
}
const enc = new TextEncoder(), dec = new TextDecoder();
const toBlob = d => d instanceof Blob ? d : new Blob([typeof d === 'string' ? enc.encode(d) : d]);
function dosTime(d){
  return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: (Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}

/* entries : [{name, data}] avec data = Blob, Uint8Array ou texte. Renvoie un Blob zip (méthode « stockée »). */
export async function buildZip(entries, onProgress){
  if (entries.length > 65535) throw new Error('trop de fichiers pour une archive zip');
  const parts = [], central = []; let offset = 0; const { time, date } = dosTime(new Date());
  for (let i = 0; i < entries.length; i++) {
    const name = enc.encode(entries[i].name), blob = toBlob(entries[i].data);
    if (blob.size > 0xFFFFFFFE) throw new Error('fichier trop volumineux : ' + entries[i].name);
    const crc = await blobCrc32(blob);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
    h.setUint32(18, blob.size, true); h.setUint32(22, blob.size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(h.buffer, name, blob);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
    c.setUint32(20, blob.size, true); c.setUint32(24, blob.size, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(c.buffer, name);
    offset += 30 + name.length + blob.size;
    if (offset > 0xFFFFFFFE) throw new Error('sauvegarde trop volumineuse (plus de 4 Go)');
    if (onProgress) onProgress(i + 1, entries.length);
  }
  const cdSize = central.reduce((s, p) => s + (p.byteLength !== undefined ? p.byteLength : p.length), 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, e.buffer], { type: 'application/zip' });
}

/* Lit l'index d'une archive. Renvoie {names, has, size, blob(name, type), text(name), check(name)}. */
export async function readZip(file){
  const tailLen = Math.min(file.size, 65557);
  const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
  let p = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { p = i; break; }
  if (p < 0) throw new Error('archive zip illisible (fin de fichier absente)');
  const count = tail.getUint16(p + 10, true), cdSize = tail.getUint32(p + 12, true), cdOff = tail.getUint32(p + 16, true);
  if (cdOff + cdSize > file.size) throw new Error('archive zip tronquée');
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const map = new Map(); let q = 0;
  for (let i = 0; i < count; i++) {
    if (q + 46 > cd.byteLength || cd.getUint32(q, true) !== 0x02014b50) throw new Error('index de l’archive abîmé');
    const method = cd.getUint16(q + 10, true), crc = cd.getUint32(q + 16, true), csize = cd.getUint32(q + 20, true), size = cd.getUint32(q + 24, true);
    const nl = cd.getUint16(q + 28, true), xl = cd.getUint16(q + 30, true), cl = cd.getUint16(q + 32, true), off = cd.getUint32(q + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, q + 46, nl));
    if (!name.endsWith('/')) map.set(name, { method, crc, csize, size, off });
    q += 46 + nl + xl + cl;
  }
  async function raw(name){
    const e = map.get(name); if (!e) throw new Error('fichier absent de l’archive : ' + name);
    const lh = new DataView(await file.slice(e.off, e.off + 30).arrayBuffer());
    if (lh.byteLength < 30 || lh.getUint32(0, true) !== 0x04034b50) throw new Error('archive abîmée : ' + name);
    const start = e.off + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    if (start + e.csize > file.size) throw new Error('archive tronquée : ' + name);
    return { e, data: file.slice(start, start + e.csize) };
  }
  async function blob(name, type){
    const { e, data } = await raw(name);
    if (e.method === 0) return type ? data.slice(0, data.size, type) : data;
    if (e.method === 8) {
      if (typeof DecompressionStream === 'undefined') throw new Error('archive compressée non prise en charge ici');
      const out = await new Response(data.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
      return type ? out.slice(0, out.size, type) : out;
    }
    throw new Error('méthode de compression inconnue : ' + name);
  }
  return {
    names: [...map.keys()],
    has: name => map.has(name),
    size: name => (map.get(name) || {}).size,
    blob,
    text: async name => dec.decode(await (await blob(name)).arrayBuffer()),
    /* Vérifie l'intégrité d'un fichier (taille et somme de contrôle). */
    check: async name => { const b = await blob(name); const e = map.get(name); return b.size === e.size && (await blobCrc32(b)) === e.crc; },
  };
}
