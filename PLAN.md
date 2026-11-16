# Plan — fusion Replay + Révise

À valider avant tout code. Références « D1, S2… » : voir [AUDIT.md](AUDIT.md).

## Décisions prises (tes réponses du 16 novembre 2026)

| Sujet | Décision |
|---|---|
| Pi Learner | C'est « Révise » (`D:\Revisions\app`). Son code et son contenu entrent dans le dépôt Replay. |
| IA | Hors ligne d'abord : chaque concept livré contient ses explications, écrites et relues. Claude en option, avec ta clé API, pour générer davantage et traiter tes PDF. |
| Signature | On garde la clé actuelle pour l'instant. Rotation en phase 6, une fois la restauration fiable. |
| Chapitre pilote | Lois de Kepler, à partir de tes notes dans `D:\Cours\Kepler` (3 photos, pas encore ouvertes). |

## Choix techniques que je propose

| Sujet | Choix | Pourquoi |
|---|---|---|
| Dépôt et identité | Tout dans `Popoulet28/replay`, même identifiant `ch.replay.app`, même adresse interne de la WebView. | La mise à jour s'installe par-dessus Replay et retrouve tes données au même endroit. Aucune désinstallation. |
| Pile | **Inchangée** : JavaScript sans framework dans une WebView Android ; même code dans WebView2 pour le .exe. | Les deux applis sont déjà faites ainsi ; le moteur d'encre est bon. |
| Seul ajout à la pile | Une étape de build (Vite) qui assemble des modules ES en `assets/www`. | Indispensable pour découper le fichier de 3 270 lignes, supprimer la double source `tools/` (T3) et pouvoir tester. Aucun framework d'interface ajouté. |
| Tests | Vitest (logique) + Playwright sur Chromium (parcours). | Chromium est le moteur de la WebView Android et de WebView2. |
| Formules | KaTeX embarqué partout ; MathJax distant supprimé. | Hors ligne, plus rapide, et règle S2. |
| Stockage | Une seule base IndexedDB versionnée, un enregistrement par objet. | Règle D2, D3, D10, P1, P2. |
| Répétition espacée | FSRS via la bibliothèque `ts-fsrs` (licence MIT), embarquée. | Implémentation de référence, déjà testée ; je n'écris que le plafond quotidien et la priorité. |
| Contenu | Un fichier par concept, avec les 5 couches, un identifiant stable et un statut `vérifié` / `à vérifier`. Validé par la CI. | Règle D15, B11, T5 et porte l'exigence d'exactitude. |
| Nom de l'appli | À toi de choisir. Par défaut je garde « Replay ». | — |

## Règles valables pour toutes les phases

- Une fonctionnalité par commit, tests verts avant chaque commit, aucune régression.
- **Aucune migration destructive** : on copie, on vérifie, on garde l'ancien stockage intact ; une sauvegarde zip est écrite automatiquement avant toute migration.
- Tout contenu que je n'ai pas relu ligne à ligne porte la mention « à vérifier » dans l'appli.
- À la fin de chaque phase : résumé, mode d'emploi pour tester, reste à faire.

## Ce que je ne peux pas faire moi-même

- **Tester sur ta tablette.** Les 60 fps, le démarrage en moins de 2 s, le rejet de paume et le stylet se vérifient sur l'OnePlus Pad 3. Je fournis une liste de contrôle et un écran de mesures intégré ; c'est toi qui valides.
- **Pousser sur GitHub** sans ton accord : je committe en local, tu décides du push (qui déclenche la Release).

---

## Phase 0 — Fondations (aucun changement visible, données mises à l'abri)

But : pouvoir modifier sans casser, et ne plus pouvoir perdre de données.

1. Découper `index.html` en modules (stockage, répétition, carnet, encre, cours, outils, jeu) sans changer le comportement ; supprimer `tools/` ; mettre Révise dans le dépôt, avec KaTeX rétabli (D12, D13).
2. Mise en place du build, du linter, de Vitest et de Playwright ; CI qui teste avant de compiler ; Release seulement sur un tag de version (T2, T7).
3. Tests unitaires sur l'existant : planification des révisions, file du jour, vérificateur d'unités, incertitudes, ajustement, analyseur de cours de Révise.
4. Nouvelle base IndexedDB + migration non destructive du carnet, des images et des cours (D2, D3, D10) ; images chargées à la demande (P1).
5. Sauvegarde : export en flux sans tout charger en mémoire (D5) ; restauration dans une zone temporaire, vérifiée, puis bascule (D1) ; sauvegarde automatique quotidienne locale (D4).
6. Enregistrement forcé au passage en arrière-plan (D6) ; ramasse-miettes des fichiers orphelins (D7).
7. KaTeX et polices embarqués (S2, S3, U6) ; retrait du code mort « cloud » (T4).
8. Corrections : B1, B2 (rejet de paume), B3, B4, B6, B10 (diagramme de phase).

**Livrable** : un APK qui fait exactement ce que fait Replay aujourd'hui, avec tes données migrées, et une suite de tests.
**Fini quand** : tes données actuelles apparaissent intactes après mise à jour ; export puis restauration sur une installation vide redonne tout ; tests verts.

## Phase 1 — MVP fusionné

1. **Coquille commune** : navigation unique, mise en page tablette paysage avec vue partagée (U1), utilisable sur téléphone ; mode sombre réglable, taille de police (U5).
2. **Cours unifiés** : une seule liste de cours (correspondance Replay ↔ Révise, T6) ; dans chaque cours : chapitres → séances, notes au stylet, PDF, et les résumés, formules, quiz et simulations de Révise.
3. **Carnet d'erreurs** : FSRS avec plafond quotidien réglable (10 par défaut) et priorité aux cartes les plus utiles ; conversion de l'état actuel sans perdre les échéances ; nouveaux motifs (calcul, concept, unités/dimensions, signe, méthode, inattention) avec conversion des anciens ; ajout rapide en moins de 10 s (photo ou capture → enregistré, détails plus tard) et « Partager vers l'appli » (U2) ; brouillon de « refaire l'exercice » conservé (U3).
4. **Chapitre pilote « Lois de Kepler » en 5 couches**, pour chaque concept (force centrale et moment cinétique, loi des orbites, loi des aires, loi des périodes, énergie et forme de l'orbite) :
   idée en une phrase → analogie avec sa limite de validité → simulation d'orbite manipulable (excentricité, masse, distance) → formule à symboles touchables (unités, effet de doubler/annuler) → exemple résolu puis exercice jumeau.
5. **Outils de compréhension du pilote** : « prédis d'abord » avant chaque simulation ; « Je ne comprends pas » (au moins 3 explications écrites par élément, jamais la même deux fois) ; curseur à 3 niveaux (12 ans / cours / examen) ; 1 à 2 questions conceptuelles sans calcul après chaque notion.
6. **Premier pont** : toute erreur dans une leçon ou un quiz part automatiquement dans le carnet, avec son motif.
7. **.exe Windows** compilé par la CI à partir du même code ; reprise de la progression Révise existante.

**Livrable** : APK + .exe.
**Fini quand** : tu peux suivre Kepler de bout en bout, tes erreurs reviennent dans la file du jour sans jamais dépasser le plafond, et tout fonctionne en mode avion.

## Phase 2 — Outils de compréhension (généralisés)

- Détection des prérequis : graphe de dépendances entre notions + mini-leçons de 2 minutes (dérivée, vecteur, intégrale, produit vectoriel…).
- « Et si… ? », « Pourquoi ? » (dérivation courte), pièges fréquents avec « pourquoi c'est tentant », résumé express de chapitre.
- Liens entre notions et graphe de connaissances coloré selon la maîtrise.
- Mode « Explique-le » (Feynman) au stylet avant la correction.
- Nouveaux types d'exercices : valeur numérique avec tolérance et unités (branchée sur le vérificateur d'unités), étapes à ordonner, trouver l'erreur, analyse dimensionnelle, glisser-déposer.

## Phase 3 — Contenu et simulations

- Parcours de leçons courtes pour les 33 chapitres de Révise, convertis au format 5 couches. Tout démarre « à vérifier » ; je relis et valide chapitre par chapitre, en commençant par Mécanique I et Thermodynamique I.
- Simulations manquantes : plan incliné, cycles thermodynamiques animés ; ajout de « prédis d'abord » et d'un équivalent textuel aux 30 simulations existantes (U8).

## Phase 4 — Le pont complet, tableau de bord, contrôles

- Depuis une zone de note : « créer une carte », « générer un exercice », « explique-moi ça ».
- Claude en option (clé API saisie dans les réglages, stockée sur l'appareil) : autres explications, structure en 5 couches proposée depuis un PDF ou une note, toujours marquée « à vérifier ».
- Tableau de bord croisé : points faibles par chapitre, par motif, évolution.
- Mode contrôle : planning à rebours mêlant leçons, erreurs et fiches. Examen blanc chronométré tiré de tes erreurs, sans indices (B12).
- Fiche de formules par cours, exportable en PDF.

## Phase 5 — Cours avancés

- Calques, annuler/rétablir illimité et conservé (U9), enregistrement incrémental des traits (P2), index spatial (P3, P4).
- Recherche dans le texte des PDF (la couche texte est conservée à l'import, D8, P5).
- Recherche dans l'écriture manuscrite via ML Kit, hors ligne — **Android uniquement** (ML Kit n'existe pas sous Windows).
- Formule manuscrite → LaTeX — **via Claude, donc en ligne**. Je ne connais pas de reconnaissance de formules hors ligne fiable ; ML Kit reconnaît du texte, pas la structure d'une formule. Si tu tiens au hors-ligne, il faudra en reparler.

## Phase 6 — Motivation, distribution, finitions

- XP et séries avec plafond quotidien, niveaux par chapitre, Pomodoro avec statistiques par cours (B13).
- Widget Android (« 7 cartes à revoir · contrôle de méca dans 5 jours »).
- Sauvegarde distante optionnelle : dépôt GitHub privé d'abord (un simple jeton) ; Google Drive ensuite si tu le veux (demande de créer un projet Google à ton nom).
- Accessibilité : contrastes mesurés, navigation clavier, lecteurs d'écran.
- Rotation de la clé de signature (S1) avec procédure export → réinstallation → restauration, testée avant.
- README complet, documentation des modules.

---

## Points que tu dois trancher avant que je commence

1. Tu valides ce plan, ou tu veux changer l'ordre ou le contenu des phases ?
2. Le nom de l'appli fusionnée (par défaut : « Replay »).
3. La phase 0 ne montre rien de nouveau à l'écran. Je la recommande telle quelle, parce que les défauts D1 à D6 peuvent te faire perdre un semestre de notes ; dis-le si tu préfères voir Kepler d'abord.
