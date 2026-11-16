/* ---------- static data ---------- */
export const DEFAULT_COURSES = {
  'Mécanique I': ['Cinématique','Lois de Newton','Bilan des forces','Frottement','Travail & énergie','Quantité de mouvement & chocs','Mouvement circulaire','Rotation & moment de force','Moment cinétique','Oscillations','Gravitation & Kepler','Référentiels'],
  'Thermodynamique I': ['Température & équilibre','Gaz parfait','Théorie cinétique','Chaleur & calorimétrie','Premier principe','Travail & diagrammes PV','Transformations adiabatiques','Moteurs & cycles','Second principe & entropie','Changements de phase','Transferts thermiques'],
  'Algèbre': ['Logique & ensembles','Nombres complexes','Systèmes linéaires','Matrices','Déterminants','Espaces vectoriels','Bases & dimension','Applications linéaires','Valeurs & vecteurs propres','Diagonalisation','Produit scalaire & orthogonalité'],
  'Analyse': ['Suites','Limites & continuité','Dérivées','Développements de Taylor','Intégrales','Techniques d’intégration','Séries numériques','Séries entières','Fonctions de plusieurs variables','Équations différentielles'],
  'Méthodes mathématiques pour la physique': ['Calcul vectoriel','Coordonnées polaires, cylindriques, sphériques','Gradient, divergence, rotationnel','Intégrales multiples','Intégrales de ligne & de surface','Équations différentielles','Nombres complexes en physique','Séries de Fourier','Analyse dimensionnelle','Approximations & développements']
};
export const COURSE_ALIASES = {'Mechanics I':'Mécanique I','Thermodynamics I':'Thermodynamique I'};
export const fixCourse = c => COURSE_ALIASES[c] || c;
export const REASONS = [
  {id:'start',   label:'Je ne savais pas par où commencer'},
  {id:'setup',   label:'Mauvaise mise en place (schéma, système, méthode)'},
  {id:'concept', label:'Notion mal comprise'},
  {id:'algebra', label:'Erreur de calcul'},
  {id:'sign',    label:'Erreur de signe ou d’unités'},
  {id:'other',   label:'Autre'}
];
export const REASON_LABEL = Object.fromEntries(REASONS.map(r=>[r.id,r.label]));
export const DEFAULT_SETTINGS = { dailyLimit:1, examLimit:3, boostDays:7, reviewMode:'quick', penOnly:true, customTopics:{}, extraCourses:[], exams:[] };
export const LS_KEY = 'replay-notebook-v1';

