import { describe, it, expect } from 'vitest';
import { keyTime, findOrphans, GC_MIN_AGE } from '../../web/src/core/gc.js';

const key = (prefix, t) => prefix + ':p' + t.toString(36) + 'abcde';
const now = Date.UTC(2026, 10, 16);

describe('nettoyage des fichiers orphelins', () => {
  it('retrouve la date de création dans une clé', () => {
    expect(keyTime(key('b', now))).toBe(now);
    expect(keyTime(key('pdf', now - 5))).toBe(now - 5);
    expect(keyTime('idb:img1')).toBe(null);
    expect(keyTime('autre chose')).toBe(null);
  });
  it('ne supprime que les fichiers non référencés et vieux de plus d’un jour', () => {
    const old = key('b', now - 3 * GC_MIN_AGE), used = key('pdf', now - 9 * GC_MIN_AGE), young = key('lo', now - 1000);
    expect(findOrphans([old, used, young, 'idb:img1'], new Set([used]), now)).toEqual([old]);
  });
  it('ne supprime jamais une clé de forme inconnue', () => {
    expect(findOrphans(['idb:img1', 'x', ''], new Set(), now)).toEqual([]);
  });
});
