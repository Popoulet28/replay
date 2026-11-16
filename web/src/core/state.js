import { DEFAULT_COURSES, DEFAULT_SETTINGS } from './data.js';
import { clone, el } from './helpers.js';

/* ---------- state ---------- */
export const S = { mode:'loading', db:null, assets:null, uid:null, settingsRef:null, col:null,
  problems:new Map(), settings:clone(DEFAULT_SETTINGS), loaded:false, stale:false,
  view:'today', session:null, libFilter:'all' };

export function courses(){ return Object.keys(DEFAULT_COURSES).concat(S.settings.extraCourses||[]); }
export const COURSE_COLORS = {'Mécanique I':'#2443b5','Thermodynamique I':'#d9541e','Algèbre':'#7a3fc4','Analyse':'#1d8a4e','Méthodes mathématiques pour la physique':'#0e8a9c'};
export const courseColor = c => COURSE_COLORS[c] || '#5d6177';
export const COURSE_SHORT={'Méthodes mathématiques pour la physique':'Méthodes math.'};
export const shortCourse=c=>COURSE_SHORT[c]||c;
export const courseOpts=()=>courses().map(c=>({id:c,label:shortCourse(c)}));
export function courseTag(c){ const n=el('span',{class:'tag course',text:shortCourse(c),title:c}); n.style.setProperty('--cc',courseColor(c)); return n; }
export const topicsOf = p => (p.topics && p.topics.length) ? p.topics : (p.topic ? [p.topic] : []);
export function topicsFor(c){ return (DEFAULT_COURSES[c]||[]).concat((S.settings.customTopics||{})[c]||[]); }
export function allProblems(){ return [...S.problems.values()]; }
export function activeProblems(){ return allProblems().filter(p=>!p.archived); }

