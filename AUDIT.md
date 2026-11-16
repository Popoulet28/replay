# Audit — Replay + Révise (« Pi Learner »)

Date : 16 novembre 2026. Aucun code n'a été modifié.

## Ce qui a été lu

| Appli | Emplacement | Lu |
|---|---|---|
| **Replay** (Android) | `Popoulet28/replay`, cloné dans `D:\Revisions\replay` (commit `89e7715`, tag v4) | Tout le JavaScript (lignes 405–3268 de `index.html`), `MainActivity.java`, manifeste, Gradle, CI, README. **Pas lu en détail** : le CSS (lignes 9–392) et les bibliothèques tierces minifiées. |
| **Révise** (Windows) | `D:\Revisions\app` + `D:\Revisions\launcher` | `app.js`, `core.js`, `index.html`, lanceur C#, script de build en entier. `viz.js` : moteur + 8 simulations sur 30. Contenu des cours : structure complète, **un seul chapitre relu ligne à ligne** (Mécanique 1). **Pas lu** : `style.css`. |

**Hypothèse à confirmer** : je n'ai trouvé aucun projet nommé « Pi Learner ». L'appli de `D:\Revisions` s'appelle « Révise » ; je la traite comme Pi Learner. Elle n'a pas de parcours façon Duolingo : c'est résumé + QCM + flashcards + simulations.

**Bonne nouvelle pour la fusion** : les deux applis sont du JavaScript sans framework, affiché dans une WebView (Android pour Replay, WebView2 pour Révise). Une seule base de code web peut servir l'APK et le .exe.

Gravité : 🔴 critique (perte de données ou sécurité) · 🟠 élevée · 🟡 moyenne · ⚪ faible.

---

## 1. Sécurité des données

### Replay

| # | Gravité | Problème | Où |
|---|---|---|---|
| D1 | 🔴 | **La restauration d'une sauvegarde détruit avant d'écrire.** Les cours, documents et fichiers sont effacés (`nbClear` ×3), puis réécrits un par un. Un zip corrompu, un manque de place ou une fermeture en cours de route = tout est perdu, sans retour arrière. | `importBackupAny`, l. 3091 |
| D2 | 🔴 | **Tout le carnet d'erreurs tient dans une seule clé `localStorage`**, réécrite en entier à chaque note. Limite ~5 Mo ; les images repliées en `data:` (cas d'échec IndexedDB) la remplissent vite. Si l'écriture échoue : un toast, et la modification disparaît à la fermeture. | `persistLocal`, l. 532 ; `storeImage`, l. 594 |
| D3 | 🔴 | **Si le JSON du carnet est illisible, l'appli démarre vide en mode « mémoire »** sans rien dire de clair et sans conserver une copie du contenu abîmé. | `startLocal`, l. 529 |
| D4 | 🟠 | **Aucune sauvegarde automatique.** Export manuel uniquement. Le README le dit : désinstaller efface tout. | `backupControls` |
| D5 | 🟠 | **L'export construit tout le zip en mémoire**, puis le passe à Android en base64 par morceaux. Avec quelques polycopiés PDF, risque réel de plantage mémoire, donc de sauvegarde impossible justement quand il y a beaucoup à perdre. | `exportBackupFull`, `saveBinary` |
| D6 | 🟠 | **Aucun enregistrement forcé quand l'appli passe en arrière-plan.** L'éditeur enregistre 900 ms après le dernier trait ; il n'y a aucun écouteur `visibilitychange`/`pagehide`. Si Android tue l'appli dans cet intervalle, les derniers traits sont perdus. | `scheduleSave`, l. 2499 |
| D7 | 🟠 | **Fichiers orphelins qui s'accumulent.** Une image ou une page PDF supprimée dans une note ne libère jamais son fichier ; à la suppression de la note, seuls les fichiers encore référencés sont effacés. Le stockage grossit sans fin. La restauration n'efface pas non plus les anciennes images du carnet. | `nbDeleteNode`, `docBlobKeys` |
| D8 | 🟡 | Un PDF importé est stocké trois fois (original + JPEG 1600 px par page + vignette). Dupliquer la note duplique aussi le PDF. | `pdfToPages`, `duplicateNote` |
| D9 | 🟡 | L'historique de révision est tronqué à 60 entrées par problème, alors que l'XP et les statistiques sont recalculés à partir de lui : ils peuvent baisser. | `rate`, l. 927 ; `computeGame` |
| D10 | 🟡 | Pas de numéro de version du schéma ni de migration explicite pour le carnet (les notes ont `v:2`, pas les problèmes). | `LS_KEY` |
| D11 | ⚪ | Les photos prises à l'appareil restent dans le cache (`cache/camera`), jamais nettoyées. | `MainActivity.cameraIntent` |

### Révise

| # | Gravité | Problème | Où |
|---|---|---|---|
| D12 | 🔴 | **Le dossier source est incomplet : `app\vendor\katex` n'existe pas.** `index.html` le charge, et il n'est présent que dans l'ancien `launcher\obj\app.zip`. Relancer `build.ps1` produirait un .exe où **aucune formule ne s'affiche**. | `app\index.html`, `build.ps1` |
| D13 | 🔴 | **Aucune gestion de version, aucune sauvegarde du code** (pas de dépôt git). | `D:\Revisions` |
| D14 | 🟠 | **Aucun export/import de la progression.** Elle vit dans le profil WebView2 (`%LOCALAPPDATA%\Revise\WebView2`). Changer de PC = repartir de zéro. Les erreurs d'écriture sont avalées en silence. | `app.js`, l. 10 |
| D15 | 🟠 | **La progression est indexée par position** (`chapitre#q3`, `chapitre#c5`). Insérer ou déplacer une question dans un fichier de cours attribue l'historique à la mauvaise question, sans avertissement. | `qid`, `cid`, l. 20–21 |

---

## 2. Sécurité

| # | Gravité | Problème | Où |
|---|---|---|---|
| S1 | 🔴 | **La clé de signature et son mot de passe sont publics.** `app/replay.keystore` est dans le dépôt, public, avec `storePassword 'replay-unige'` en clair. N'importe qui peut signer un APK qu'Android acceptera comme mise à jour de Replay (accès à toutes tes données). Risque concret faible pour une appli personnelle, mais la clé est définitivement compromise. | `app/build.gradle`, l. 19–22 |
| S2 | 🟠 | **Script distant exécuté avec accès complet.** MathJax est chargé depuis `cdn.jsdelivr.net/npm/mathjax@3` (version flottante, sans contrôle d'intégrité) dans la même page que le pont `AndroidBridge` et toutes les données. | `ensureMathJax`, l. 604 |
| S3 | 🟡 | Polices chargées depuis Google Fonts à chaque démarrage (requête réseau, pas de version locale). | `index.html`, l. 7–8 |
| S4 | ⚪ | `lint` désactivé, `minifyEnabled false`, `targetSdk 34` (un cran derrière `compileSdk 35`). | `app/build.gradle` |

---

## 3. Bugs

### Replay

| # | Gravité | Problème | Où |
|---|---|---|---|
| B1 | 🟠 | **Rejet de paume incomplet.** Si deux points de contact de la main arrivent avant le stylet, un pincement démarre et n'est pas annulé quand le stylet se pose : la page peut zoomer ou glisser pendant l'écriture. Seul le défilement à un doigt est annulé. À confirmer sur la tablette. | `onDown`, l. 2594–2599 |
| B2 | 🟠 | **Annulation accidentelle.** Un toucher bref à deux doigts déclenche « annuler » ; deux contacts de paume brefs suffisent. | `onUp`, l. 2671 |
| B3 | 🟡 | **Les révisions bonus consomment le quota du jour.** `reviewedToday` compte toutes les notes du jour, y compris « Refaire maintenant » et « Encore un ». | l. 632, 647 |
| B4 | 🟡 | Arrondi des incertitudes : l'outil annonce 2 chiffres significatifs, mais ne les garantit que si l'incertitude est < 10 (ex. 1234 ± 456 n'est pas arrondi). | `fmtVU`, l. 1573 |
| B5 | 🟡 | Le badge « Paré au contrôle » est impossible à obtenir dans l'APK (il exige une fiche générée par Claude, indisponible hors claude.ai). | `BADGES`, l. 1841 |
| B6 | 🟡 | Fuites : un écouteur `keyup` ajouté à chaque ouverture de l'éditeur et jamais retiré ; documents PDF ouverts jamais libérés (`PDFDOCS`) ; URL d'aperçus jamais révoquées (`snapCache`, `thumbCache`). | l. 2995, 2096, 3237 |
| B7 | ⚪ | Deux collages rapides d'images vont tous deux dans « énoncé » (le test se fait avant la fin de la compression). | `onPaste`, l. 980 |
| B8 | ⚪ | Vérificateur d'unités : symboles ambigus par défaut (`T` = période, `C` = J/K, `N` = force) ; `mgh` est découpé automatiquement, ce qui peut masquer une faute de frappe. | `DEFAULT_SYMBOLS`, `splitId` |
| B9 | ⚪ | Code mort : `(nbIsRoot(n.parent)?n.parent:n.parent)`. | l. 1968 |

### Révise

| # | Gravité | Problème | Où |
|---|---|---|---|
| B10 | 🟠 | **Diagramme de phase de l'eau faux sur deux points** : la frontière solide–liquide est dessinée avec une pente positive (pour l'eau elle est négative), et le repère « 1 atm » ne traverse pas cette frontière à 0 °C. Le schéma est dit « schématique » mais le titre parle d'eau. | `VIZ.phases`, `viz.js` l. 684–688 |
| B11 | 🟡 | L'analyseur de cours ne gère aucune erreur : une ligne avant `@chapter` fait planter le chargement ; un ` :: ` manquant produit une carte tronquée sans alerte. | `parseCourse`, `core.js` |
| B12 | 🟡 | « Examen blanc » n'a pas de limite de temps, seulement un chronomètre. | `app.js`, l. 281 |
| B13 | ⚪ | Minuteur Pomodoro en mémoire seulement (perdu au rechargement), dérive de `setInterval`, aucune statistique par cours. | `app.js`, l. 256 |
| B14 | ⚪ | Les simulations ne gèrent pas `pointercancel` ; texte des canevas en « Segoe UI » (absent sur Android). | `widget`, `viz.js` |

---

## 4. Performance

| # | Gravité | Problème | Où |
|---|---|---|---|
| P1 | 🟠 | **Au démarrage, toutes les images du carnet sont lues en mémoire** pour créer leurs URL. Le temps de lancement croît avec le nombre d'erreurs enregistrées ; incompatible avec « moins de 2 s » à terme. | `startLocal`, l. 522 |
| P2 | 🟠 | **Chaque enregistrement réécrit la note entière** (tous les traits). Sur un long cours, c'est plusieurs Mo toutes les 900 ms d'écriture. | `save`, l. 2505 |
| P3 | 🟡 | Le trait en cours est recalculé en entier à chaque mouvement du stylet (coût quadratique sur un long trait). | `drawLive`, l. 2567 |
| P4 | 🟡 | Pas d'index spatial : chaque rendu parcourt tous les traits de la note. Correct pour une page, à surveiller sur un tableau infini très rempli. | `drawScene`, l. 2323 |
| P5 | 🟡 | Import PDF : toutes les pages sont rasterisées à l'import, l'une après l'autre (lent sur un polycopié de 100 pages). | `pdfToPages` |
| P6 | ⚪ | Révise reconstruit toute la page en `innerHTML` à chaque action et enregistre à chaque affichage de chapitre. | `render`, `vChapter` |

Rien n'a été mesuré sur la tablette : ces points viennent de la lecture du code. L'éditeur contient déjà une fonction `perf()` utilisable pour mesurer.

---

## 5. UX / UI et accessibilité

| # | Gravité | Problème |
|---|---|---|
| U1 | 🟠 | **Pas pensé pour la tablette en paysage** : contenu limité à 940 px de large, aucune vue partagée (note à gauche, explication à droite). |
| U2 | 🟠 | **Ajouter une erreur demande un formulaire de 7 champs** ; pas de capture rapide, pas de partage depuis une autre appli (« Partager vers Replay »). Loin des 10 s visées. |
| U3 | 🟠 | **Le brouillon de révision n'est pas enregistré** : « refaire l'exercice » ne laisse aucune trace comparable d'une fois à l'autre. |
| U4 | 🟡 | Sept onglets textuels dans la barre du bas : serré sur téléphone. |
| U5 | 🟡 | Mode sombre uniquement selon le système (pas de réglage) ; aucune taille de police réglable. |
| U6 | 🟡 | Hors ligne, les formules ne s'affichent pas (MathJax distant) et les polices changent. |
| U7 | 🟡 | La recherche dans les cours ne porte que sur les noms de notes. |
| U8 | 🟡 | Les simulations (canevas) n'ont aucun équivalent textuel ; les étiquettes de motifs d'erreur ne correspondent pas à celles demandées. |
| U9 | ⚪ | Annuler limité à 120 étapes et perdu à la fermeture de la note. |

---

## 6. Dette technique

| # | Gravité | Problème |
|---|---|---|
| T1 | 🟠 | **Un seul fichier de 3 270 lignes / 256 Ko**, variables globales, lignes jusqu'à 555 caractères. Aucun module, aucun build, aucun linter. |
| T2 | 🟠 | **Aucun test**, ni dans Replay ni dans Révise. La CI compile et publie sans rien vérifier. |
| T3 | 🟠 | **Deux sources de vérité** : `tools/ink*.js` et `tools/notes.css` sont des copies exactes du code collé dans `index.html`. La prochaine modification les fera diverger. |
| T4 | 🟡 | **Environ 350 lignes mortes dans l'APK** : le mode « cloud » et les trois aides Claude (indice, vérification, fiche) ne fonctionnent que dans claude.ai. |
| T5 | 🟡 | Contenu de Révise codé en dur dans du JavaScript avec un mini-langage maison, sans validation. |
| T6 | 🟡 | Deux moteurs de formules (MathJax distant d'un côté, KaTeX embarqué de l'autre), deux styles, deux systèmes de stockage, deux listes de cours aux noms différents (« Thermodynamique I » / « Physique macroscopique », « Algèbre » / « Algèbre linéaire », « Analyse » / « Analyse I »). |
| T7 | 🟡 | Le .exe se compile à la main avec `csc` et des DLL posées dans le dossier ; pas de CI. Une Release est publiée à chaque push, même pour une modification de README. |

---

## 7. Fonctionnalités manquantes par rapport à la cible

**Compréhension (priorité n°1) — rien n'existe encore :**
structure en 5 couches, analogies avec limites de validité, bouton « Je ne comprends pas », curseur de niveau, détection des prérequis, « prédis d'abord », « Et si… ? », résumé express, « Pourquoi ? », vérification conceptuelle, graphe de connaissances, mode Feynman, génération depuis un PDF.
Existant réutilisable : résumés, pièges par chapitre, formulaire, 30 simulations à curseurs.

**Contenu :** aucun chapitre sur la gravitation ni sur Kepler dans Révise, et aucune simulation d'orbites. Le chapitre pilote de la phase 1 est à écrire entièrement.

**Cours :** pas de niveau « séance », pas de calques, pas de recherche dans les PDF (la couche texte est jetée à l'import) ni dans l'écriture manuscrite, pas de conversion manuscrit → LaTeX.

**Carnet d'erreurs :** l'algorithme est un SM-2 simplifié, pas FSRS ; pas de motif « inattention » ; « signe » et « unités » sont fusionnés.

**Leçons :** uniquement des QCM. Manquent : réponse numérique avec tolérance et unités, étapes à ordonner, trouver l'erreur, analyse dimensionnelle, glisser-déposer. Les erreurs de quiz ne vont pas dans le carnet. Les flashcards n'ont aucun plafond quotidien (toutes les cartes dues + 10 nouvelles).

**Pont :** « → Carnet » existe depuis une sélection, un tampon ou une page. Manquent : « générer un exercice », « explique-moi ça », tableau de bord croisé, planning à rebours, examen blanc tiré des erreurs, export PDF de la fiche de formules.

**Motivation :** XP, niveaux, quêtes et badges existent dans Replay, sans plafond quotidien. Pas de widget Android.

**Distribution :** pas de sauvegarde Drive/GitHub, pas de .exe en CI.

---

## 8. Ce qui est bon et à garder

- **Le moteur d'encre de Replay** : pression, trois plumes, prédiction du trait, cache de rendu, gomme précise, lasso, reconnaissance de formes, cahiers et tableau infini, PDF net au zoom.
- **Les tampons ? ★ ƒ** et l'envoi d'une zone vers le carnet : c'est déjà l'amorce du « pont ».
- **Le vérificateur d'unités, la propagation d'incertitudes et l'ajustement linéaire** : logique propre, facile à tester.
- **Le mode contrôle** de Replay (priorité aux thèmes du contrôle, plafond relevé).
- **Les 30 simulations de Révise** et son petit moteur de widgets, déjà à curseurs.
- **Le contenu de Révise** : 5 cours, 33 chapitres, 225 questions de quiz. Le chapitre relu est exact.
- **Le lanceur Windows** : 130 lignes, réutilisable tel quel pour le .exe de l'appli fusionnée.

---

## 9. Limites de cet audit

- Rien n'a été exécuté : ni l'APK sur la tablette, ni le .exe. Les bugs B1 et B2 et tous les points de performance sont déduits du code.
- L'exactitude physique n'a été vérifiée que sur un chapitre et 8 simulations. Les 32 autres chapitres et 22 autres simulations restent à relire avant d'être présentés comme fiables.
- Le CSS des deux applis n'a pas été audité (contrastes, mise en page tablette).
