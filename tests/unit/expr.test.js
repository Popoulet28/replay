import { describe, it, expect } from 'vitest';
import { parseExpr, evalNum, evalDim, symbolTable, DEFAULT_SYMBOLS, UNIT_TABLE, fmtDim, show, idsIn, splitId, dEq } from '../../web/src/tools/expr.js';
import { fmtVU, parseNum } from '../../web/src/tools/numfmt.js';

const { tab, errs } = symbolTable(DEFAULT_SYMBOLS);
const dim = src => evalDim(parseExpr(src).left, tab).d;
const homogeneous = src => { const a = parseExpr(src); return dEq(evalDim(a.left, tab).d, evalDim(a.right, tab).d); };

describe('analyse des expressions', () => {
  it('respecte les priorités, les puissances et le produit implicite', () => {
    expect(evalNum(parseExpr('1 + 2 * 3').left, {})).toBe(7);
    expect(evalNum(parseExpr('2^3^2').left, {})).toBe(512);
    expect(evalNum(parseExpr('-2^2').left, {})).toBe(-4);
    expect(evalNum(parseExpr('2 a x').left, { a: 3, x: 5 })).toBe(30);
    expect(evalNum(parseExpr('1/2 m v^2').left, { m: 4, v: 3 })).toBe(18);
  });
  it('accepte la virgule décimale, les symboles ×, ², √ et π', () => {
    expect(evalNum(parseExpr('1,5 × 2').left, {})).toBe(3);
    expect(evalNum(parseExpr('x²').left, { x: 4 })).toBe(16);
    expect(evalNum(parseExpr('√(9)').left, {})).toBe(3);
    expect(evalNum(parseExpr('2 pi').left, {})).toBeCloseTo(2 * Math.PI, 12);
  });
  it('calcule g = 4π²l/T² pour un pendule', () => {
    const { left, right } = parseExpr('g = 4 pi^2 l / T^2');
    expect(left).toEqual({ t: 'id', n: 'g' });
    expect(evalNum(right, { l: 0.85, T: 1.85 })).toBeCloseTo(9.8047, 3);
    expect([...idsIn(right)].sort()).toEqual(['T', 'l']);
  });
  it('signale les expressions mal formées', () => {
    expect(() => parseExpr('2 +')).toThrow();
    expect(() => parseExpr('(1 + 2')).toThrow();
    expect(() => parseExpr('2 $ 3')).toThrow();
    expect(() => parseExpr('')).toThrow();
  });
  it('réaffiche une expression lisible', () => {
    expect(show(parseExpr('v0^2 + 2 a x').left)).toBe('v0^2 + 2 a x');
  });
});

describe('analyse dimensionnelle', () => {
  it('la table de symboles par défaut se lit sans erreur', () => {
    expect(errs).toEqual([]);
  });
  it('reconnaît les formules homogènes', () => {
    for (const f of ['F = m a', 'E = 1/2 m v^2 + m g h', 'v^2 = v0^2 + 2 a x', 'T = 2 pi sqrt(l/g)', 'F = G m M / r^2', 'p = m v'])
      expect(homogeneous(f), f).toBe(true);
  });
  it('troisième loi de Kepler : T² et a³/(GM) ont la même dimension', () => {
    expect(dEq(dim('T^2'), dim('4 pi^2 r^3 / (G M)'))).toBe(true);
  });
  it('détecte une addition de grandeurs différentes', () => {
    let err; try { dim('v t + a t'); } catch (e) { err = e; }
    expect(err && err.mismatch).toBeTruthy();
  });
  it('détecte une équation non homogène', () => {
    expect(homogeneous('E = m v')).toBe(false);
  });
  it('exige un argument sans dimension pour sin, exp, ln', () => {
    expect(() => dim('sin(x)')).toThrow();
    expect(dim('sin(omega t)')).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('gère les racines et les puissances fractionnaires', () => {
    expect(dim('sqrt(l/g)')).toEqual([0, 0, 1, 0, 0, 0]);
    expect(() => dim('m^x')).toThrow();
  });
  it('signale un symbole inconnu', () => {
    let err; try { dim('zz + 1'); } catch (e) { err = e; }
    expect(err.unknown).toBe('zz');
  });
  it('découpe « mgh » en m·g·h mais pas un symbole seul', () => {
    expect(splitId('mgh', tab)).toEqual(['m', 'g', 'h']);
    expect(splitId('m', tab)).toBe(null);
  });
  it('affiche les dimensions avec leur unité dérivée', () => {
    expect(fmtDim(dim('m a'))).toBe('kg·m·s⁻² (= N)');
    expect(fmtDim(dim('m v^2'))).toBe('kg·m²·s⁻² (= J)');
    expect(fmtDim([0, 0, 0, 0, 0, 0])).toBe('sans dimension');
    expect(fmtDim(dim('sqrt(x)'))).toBe('m¹ᐟ²');
  });
  it('les unités dérivées de la table sont cohérentes entre elles', () => {
    const u = src => evalDim(parseExpr(src).left, UNIT_TABLE).d;
    expect(dEq(u('N m'), u('J'))).toBe(true);
    expect(dEq(u('J/s'), u('W'))).toBe(true);
    expect(dEq(u('N/m^2'), u('Pa'))).toBe(true);
    expect(dEq(u('V A'), u('W'))).toBe(true);
    expect(dEq(u('A s'), u('C'))).toBe(true);
  });
});

describe('nombres avec incertitude', () => {
  it('arrondit la valeur au même rang que l’incertitude', () => {
    expect(fmtVU(9.80471, 0.1083).txt).toBe('(9.80 ± 0.11)');
    expect(fmtVU(2.4567, 0.034).txt).toBe('(2.457 ± 0.034)');
    expect(fmtVU(12.3456, 1.2).txt).toBe('(12.3 ± 1.2)');
  });
  it('passe en notation scientifique pour les très grands et très petits nombres', () => {
    expect(fmtVU(6.674e-11, 1.5e-14).txt).toBe('(6.6740 ± 0.0015) × 10^-11');
    expect(fmtVU(123456, 0).txt).toBe('1.235 × 10^5');
  });
  it('sans incertitude, garde 4 chiffres significatifs', () => {
    expect(fmtVU(3.14159, 0).txt).toBe('3.142');
  });
  it('lit les nombres à virgule', () => {
    expect(parseNum(' 1,85 ')).toBe(1.85);
    expect(Number.isNaN(parseNum(''))).toBe(true);
  });
});
