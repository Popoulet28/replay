// Point d'entrée : charge tous les modules puis démarre l'application.
import './core/helpers.js';
import './core/data.js';
import './core/state.js';
import './core/storage.js';
import './core/images.js';
import './ui/math.js';
import './srs/schedule.js';
import './ui/chrome.js';
import './ui/components.js';
import './views/today.js';
import './views/review.js';
import './views/add.js';
import './views/library.js';
import './views/stats.js';
import './views/exams.js';
import './views/settings.js';
import './ai/claude.js';
import './tools/expr.js';
import './tools/units.js';
import './tools/uncertainty.js';
import './tools/fit.js';
import './tools/view.js';
import './views/tasks.js';
import './game/game.js';
import './core/backup.js';
import './notes/store.js';
import './notes/prefs.js';
import './notes/bitmaps.js';
import './notes/pdf.js';
import './notes/templates.js';
import './notes/geometry.js';
import './notes/objects.js';
import './notes/scene.js';
import './notes/editor.js';
import './notes/files.js';
import './views/cours.js';
import { init } from './core/storage.js';
import { S } from './core/state.js';
import { NB } from './notes/store.js';
import { collectGarbage } from './core/gc.js';

// Accès pour le débogage et les tests de bout en bout.
window.__replay = { S, NB, collectGarbage };

init();
