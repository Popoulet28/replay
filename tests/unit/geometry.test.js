import { describe, it, expect } from 'vitest';
import { strokeBox, rdp, segDist, recognizeShape, shapeToPts, splitStroke, hitStroke, pointInPoly, outlinePoints } from '../../web/src/notes/geometry.js';

const pts = arr => arr.flatMap(([x, y]) => [x, y, 0.5]);
const stroke = (arr, size = 2) => ({ id: 's', tool: 'pen', pen: 'ball', color: '#000', size, pts: pts(arr) });

describe('géométrie de l’encre', () => {
  it('calcule la boîte englobante avec la marge du trait', () => {
    const b = strokeBox(stroke([[10, 20], [110, 60]], 10));
    expect(b).toEqual([1, 11, 119, 69]);
  });
  it('distance d’un point à un segment', () => {
    expect(segDist([5, 5], [0, 0], [10, 0])).toBe(5);
    expect(segDist([-3, 4], [0, 0], [10, 0])).toBe(5);
    expect(segDist([1, 1], [2, 2], [2, 2])).toBeCloseTo(Math.SQRT2, 12);
  });
  it('simplifie une ligne brisée (Ramer–Douglas–Peucker)', () => {
    const line = []; for (let i = 0; i <= 20; i++) line.push([i * 5, (i % 2) * 0.2]);
    expect(rdp(line, 1)).toEqual([[0, 0], [100, 0]]);
    expect(rdp([[0, 0], [50, 40], [100, 0]], 1)).toHaveLength(3);
  });
  it('test du point dans un polygone', () => {
    const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(pointInPoly(5, 5, sq)).toBe(true);
    expect(pointInPoly(15, 5, sq)).toBe(false);
  });
  it('le contour d’un trait est un polygone fermé autour des points', () => {
    const out = outlinePoints(pts([[0, 0], [50, 0], [100, 0]]), 4, 'ball', true);
    expect(out.length).toBeGreaterThan(8);
    for (const [x, y] of out) { expect(Math.abs(y)).toBeLessThanOrEqual(2.01); expect(x).toBeGreaterThan(-2.1); expect(x).toBeLessThan(102.1); }
  });
});

describe('reconnaissance de formes', () => {
  it('reconnaît un trait presque droit', () => {
    const p = []; for (let i = 0; i <= 30; i++) p.push([i * 6, 100 + Math.sin(i) * 1.5]);
    const sh = recognizeShape(pts(p));
    expect(sh.type).toBe('line');
  });
  it('reconnaît un cercle tracé à la main', () => {
    const p = []; for (let i = 0; i <= 60; i++) { const t = i / 60 * 2 * Math.PI; p.push([200 + 80 * Math.cos(t) + Math.sin(i) * 2, 200 + 80 * Math.sin(t)]); }
    const sh = recognizeShape(pts(p));
    expect(sh.type).toBe('ellipse');
    expect(sh.rx).toBeGreaterThan(75); expect(sh.rx).toBeLessThan(85);
  });
  it('reconnaît un rectangle et le redresse sur les axes', () => {
    const p = []; const c = [[0, 0], [200, 3], [203, 120], [2, 118], [0, 0]];
    for (let k = 0; k < 4; k++) for (let i = 0; i < 15; i++) p.push([c[k][0] + (c[k + 1][0] - c[k][0]) * i / 15, c[k][1] + (c[k + 1][1] - c[k][1]) * i / 15]);
    p.push([0, 0]);
    const sh = recognizeShape(pts(p));
    expect(sh.type).toBe('poly'); expect(sh.pts).toHaveLength(4);
    expect(sh.pts[0][1]).toBe(sh.pts[1][1]);
  });
  it('ne reconnaît rien dans un gribouillis ouvert', () => {
    const p = []; for (let i = 0; i <= 40; i++) p.push([i * 5, 100 + 60 * Math.sin(i / 2)]);
    expect(recognizeShape(pts(p))).toBe(null);
  });
  it('transforme une forme en points de trait', () => {
    const a = shapeToPts({ type: 'line', pts: [[0, 0], [60, 0]] }, 0.5);
    expect(a.length % 3).toBe(0);
    expect(a.slice(0, 3)).toEqual([0, 0, 0.5]);
    expect(a.slice(-3)).toEqual([60, 0, 0.5]);
  });
});

describe('gomme', () => {
  it('détecte le contact avec un trait', () => {
    const st = stroke([[0, 0], [100, 0]]);
    expect(hitStroke(st, 50, 3, 4)).toBe(true);
    expect(hitStroke(st, 50, 30, 4)).toBe(false);
  });
  it('la gomme précise coupe le trait en deux morceaux', () => {
    const st = stroke([[0, 0], [20, 0], [40, 0], [60, 0], [80, 0], [100, 0]]);
    const parts = splitStroke(st, 50, 0, 6);
    expect(parts).toHaveLength(2);
    const xs = parts.map(p => p.pts.filter((_, i) => i % 3 === 0));
    expect(Math.max(...xs[0])).toBeLessThan(50);
    expect(Math.min(...xs[1])).toBeGreaterThan(50);
    expect(parts[0].color).toBe(st.color);
    expect(parts[0].id).not.toBe(st.id);
  });
  it('renvoie null si la gomme ne touche pas le trait', () => {
    expect(splitStroke(stroke([[0, 0], [100, 0]]), 50, 80, 6)).toBe(null);
  });
});
