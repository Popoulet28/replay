import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { S } from '../../web/src/core/state.js';
import { DEFAULT_SETTINGS } from '../../web/src/core/data.js';
import { addDays, diffDays, today, ymd, parseYmd } from '../../web/src/core/helpers.js';
import { newSrs, schedule, backlog, todayQueue, dailyLimit, reviewedToday, streak } from '../../web/src/srs/schedule.js';

const prob = (id, over = {}) => Object.assign({ id, course: 'Mécanique I', topics: [], history: [], archived: false, srs: { ease: 2.3, interval: 0, reps: 0, lapses: 0, due: '2026-11-16', last: null } }, over);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0)); // 16 novembre 2026
  S.problems = new Map();
  S.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
});
afterEach(() => vi.useRealTimers());

describe('dates', () => {
  it('ajoute des jours en traversant un changement d’heure', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('compte les jours entre deux dates, y compris au changement d’heure', () => {
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
    expect(diffDays('2026-03-27', '2026-03-30')).toBe(3);
    expect(diffDays('2026-11-16', '2026-11-10')).toBe(-6);
  });
  it('aller-retour texte ↔ date', () => {
    expect(ymd(parseYmd('2026-02-09'))).toBe('2026-02-09');
    expect(today()).toBe('2026-11-16');
  });
});

describe('planification d’un problème', () => {
  it('un nouveau problème revient le lendemain', () => {
    expect(newSrs()).toEqual({ ease: 2.3, interval: 0, reps: 0, lapses: 0, due: '2026-11-17', last: null });
  });
  it('première révision : 1, 1, 3 ou 5 jours selon la note', () => {
    const p = prob('a');
    expect(schedule(p, 'again').interval).toBe(1);
    expect(schedule(p, 'hard').interval).toBe(1);
    expect(schedule(p, 'good').interval).toBe(3);
    expect(schedule(p, 'easy').interval).toBe(5);
  });
  it('« à revoir » remet les répétitions à zéro, compte un oubli et baisse la facilité', () => {
    const r = schedule(prob('a', { srs: { ease: 2.3, interval: 20, reps: 4, lapses: 1, due: '2026-11-16', last: '2026-10-27' } }), 'again');
    expect(r).toMatchObject({ interval: 1, reps: 0, lapses: 2, ease: 2.1, due: '2026-11-17', last: '2026-11-16' });
  });
  it('« bien » multiplie l’intervalle par la facilité', () => {
    const r = schedule(prob('a', { srs: { ease: 2.3, interval: 10, reps: 3, lapses: 0, due: '2026-11-16', last: '2026-11-06' } }), 'good');
    expect(r.interval).toBe(23); expect(r.due).toBe('2026-12-09'); expect(r.reps).toBe(4);
  });
  it('la facilité reste entre 1,3 et 3 et l’intervalle ne dépasse pas 180 jours', () => {
    let p = prob('a', { srs: { ease: 1.35, interval: 5, reps: 2, lapses: 0, due: '2026-11-16', last: null } });
    expect(schedule(p, 'again').ease).toBe(1.3);
    p = prob('a', { srs: { ease: 2.95, interval: 150, reps: 6, lapses: 0, due: '2026-11-16', last: null } });
    const r = schedule(p, 'easy');
    expect(r.ease).toBe(3); expect(r.interval).toBe(180);
  });
  it('ne modifie pas le problème reçu', () => {
    const p = prob('a'); const before = JSON.stringify(p); schedule(p, 'good');
    expect(JSON.stringify(p)).toBe(before);
  });
});

describe('file du jour', () => {
  it('ne propose que les problèmes dus, non archivés, dans la limite quotidienne', () => {
    S.settings.dailyLimit = 2;
    S.problems.set('a', prob('a', { srs: { ...prob('a').srs, due: '2026-11-10' } }));
    S.problems.set('b', prob('b', { srs: { ...prob('b').srs, due: '2026-11-16' } }));
    S.problems.set('c', prob('c', { srs: { ...prob('c').srs, due: '2026-11-12' } }));
    S.problems.set('d', prob('d', { srs: { ...prob('d').srs, due: '2026-11-20' } }));
    S.problems.set('e', prob('e', { archived: true, srs: { ...prob('e').srs, due: '2026-11-01' } }));
    expect(backlog().map(p => p.id)).toEqual(['a', 'c', 'b']);
    expect(todayQueue().map(p => p.id)).toEqual(['a', 'c']);
  });
  it('à échéance égale, le problème le plus souvent oublié passe d’abord', () => {
    S.problems.set('a', prob('a', { srs: { ...prob('a').srs, due: '2026-11-15', lapses: 0 } }));
    S.problems.set('b', prob('b', { srs: { ...prob('b').srs, due: '2026-11-15', lapses: 3 } }));
    expect(backlog().map(p => p.id)).toEqual(['b', 'a']);
  });
  it('les révisions déjà faites aujourd’hui réduisent la file', () => {
    S.settings.dailyLimit = 2;
    S.problems.set('a', prob('a', { history: [{ d: '2026-11-16', r: 'good', m: 'quick' }], srs: { ...prob('a').srs, due: '2026-11-19', last: '2026-11-16' } }));
    S.problems.set('b', prob('b', { srs: { ...prob('b').srs, due: '2026-11-15' } }));
    S.problems.set('c', prob('c', { srs: { ...prob('c').srs, due: '2026-11-15' } }));
    expect(reviewedToday()).toBe(1);
    expect(todayQueue()).toHaveLength(1);
  });
  it('les révisions en plus (bonus, refaire maintenant) ne consomment pas le quota', () => {
    S.settings.dailyLimit = 1;
    S.problems.set('a', prob('a', { history: [{ d: '2026-11-16', r: 'good', m: 'quick', x: 1 }], srs: { ...prob('a').srs, due: '2026-11-19', last: '2026-11-16' } }));
    S.problems.set('b', prob('b', { srs: { ...prob('b').srs, due: '2026-11-15' } }));
    expect(reviewedToday()).toBe(0);
    expect(todayQueue().map(p => p.id)).toEqual(['b']);
  });
  it('un contrôle proche relève la limite et fait passer ses thèmes en premier', () => {
    S.settings.dailyLimit = 1; S.settings.examLimit = 3; S.settings.boostDays = 7;
    S.settings.exams = [{ id: 'x', name: 'Contrôle 2', date: '2026-11-20', course: 'Mécanique I', topics: ['Gravitation & Kepler'] }];
    S.problems.set('a', prob('a', { topics: ['Cinématique'], srs: { ...prob('a').srs, due: '2026-11-10' } }));
    S.problems.set('k', prob('k', { topics: ['Gravitation & Kepler'], srs: { ...prob('k').srs, due: '2026-11-16' } }));
    // dû après le contrôle et pas revu depuis deux semaines : ramené avant le contrôle
    S.problems.set('m', prob('m', { topics: ['Gravitation & Kepler'], srs: { ...prob('m').srs, due: '2026-12-15', last: '2026-10-01' } }));
    expect(dailyLimit()).toBe(3);
    expect(backlog().map(p => p.id)).toEqual(['k', 'm', 'a']);
  });
  it('sans contrôle proche, la limite est celle des réglages', () => {
    S.settings.dailyLimit = 4;
    S.settings.exams = [{ id: 'x', name: 'Loin', date: '2026-12-20', course: 'Mécanique I', topics: [] }];
    expect(dailyLimit()).toBe(4);
  });
});

describe('série de jours', () => {
  it('compte les jours actifs consécutifs, aujourd’hui compris ou non', () => {
    S.problems.set('a', prob('a', { created: '2026-11-13', history: [{ d: '2026-11-14', r: 'good' }, { d: '2026-11-15', r: 'good' }] }));
    expect(streak()).toBe(3);
    S.problems.get('a').history.push({ d: '2026-11-16', r: 'good' });
    expect(streak()).toBe(4);
  });
  it('vaut zéro après un jour sans activité', () => {
    S.problems.set('a', prob('a', { created: '2026-11-10', history: [{ d: '2026-11-13', r: 'good' }] }));
    expect(streak()).toBe(0);
  });
});
