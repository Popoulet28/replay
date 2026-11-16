/* Enregistre un fichier pour l'utilisateur : dans Téléchargements sur Android (via le pont natif),
   par téléchargement du navigateur ailleurs. Le fichier est envoyé par tranches : jamais tout en mémoire. */

const SLICE = 3 * 262144; // multiple de 3 : chaque tranche s'encode en base64 sans remplissage intermédiaire
function toBase64(bytes){
  let s = '';
  for (let j = 0; j < bytes.length; j += 8190) s += String.fromCharCode.apply(null, bytes.subarray(j, j + 8190));
  return btoa(s);
}
export const hasNativeFiles = () => !!(window.AndroidBridge && window.AndroidBridge.beginFile);
export const hasNativeFolders = () => !!(window.AndroidBridge && window.AndroidBridge.beginFileIn);

/* opts : {folder (sous-dossier de Téléchargements, Android), onProgress(fraction)}. Renvoie true si le fichier est écrit en entier. */
export async function saveBlob(name, mime, blob, opts){
  opts = opts || {};
  const B = window.AndroidBridge;
  if (B && B.beginFile) {
    const ok = opts.folder && B.beginFileIn ? B.beginFileIn(opts.folder, name, mime) : B.beginFile(name, mime);
    if (!ok) return false;
    try {
      for (let i = 0, n = 0; i < blob.size; i += SLICE, n++) {
        const part = new Uint8Array(await blob.slice(i, i + SLICE).arrayBuffer());
        if (!B.appendBase64(toBase64(part))) throw new Error('écriture interrompue');
        if (opts.onProgress) opts.onProgress(Math.min(1, (i + SLICE) / blob.size));
        if (n % 4 === 3) await new Promise(r => setTimeout(r, 0)); // laisse respirer l'interface
      }
      return !!B.endFile();
    } catch (e) {
      console.warn('saveBlob', e);
      try { if (B.abortFile) B.abortFile(); else B.endFile(); } catch (_) {}
      return false;
    }
  }
  const a = document.createElement('a'); const url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
