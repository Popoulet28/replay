/* Choix des fichiers orphelins : logique pure, sans dépendance. */
export const GC_MIN_AGE = 86400000;

/* Les clés sont de la forme « préfixe:p<horodatage en base 36><5 caractères> » : on en tire la date de création. */
export function keyTime(key){
  const m = /^[a-z]+:p([0-9a-z]{8})[0-9a-z]{5}$/.exec(String(key));
  if (!m) return null;
  const t = parseInt(m[1], 36);
  return Number.isFinite(t) ? t : null;
}
/* Clés à supprimer : non référencées ET assez anciennes. Une clé de forme inconnue n'est jamais supprimée. */
export function findOrphans(keys, referenced, now, minAge = GC_MIN_AGE){
  return keys.filter(k => { if (referenced.has(k)) return false; const t = keyTime(k); return t !== null && now - t >= minAge; });
}
