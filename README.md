# Replay

Cours au stylet, carnet d'erreurs avec répétition espacée et, bientôt, leçons de physique (fusion avec « Révise »).
Une seule base de code web, affichée dans une WebView Android (APK) et dans WebView2 sous Windows (.exe).

Voir [AUDIT.md](AUDIT.md) (état des lieux) et [PLAN.md](PLAN.md) (phases).

## Installer sur la tablette

1. Sur GitHub, onglet **Actions** : chaque push construit `Replay.apk` (artefact « Replay-apk »).
   Les versions publiques (onglet **Releases**) ne sont créées que pour un tag : `git tag v5 && git push --tags`.
2. Installe l'APK **par-dessus** l'ancienne version : même identifiant, même signature, tes données sont reprises.
   À la première ouverture, l'ancien carnet est copié dans la nouvelle base ; l'original n'est pas effacé.

## Tes données

- Tout reste sur l'appareil (IndexedDB). Rien n'est envoyé sur Internet.
- **Sauvegarde automatique** (Android) dans `Téléchargements/Replay`, chaque semaine par défaut ; les 2 dernières sont gardées. Réglable dans *Réglages → Tes données*.
- **Restaurer** une sauvegarde ne touche jamais aux données en place : la sauvegarde est vérifiée, copiée à côté, puis activée. Les données d'avant restent récupérables (*Revenir à ces données*) jusqu'à ce que tu libères la place.
- Désinstaller l'appli efface ses données, mais pas les sauvegardes de Téléchargements.

## Développer

Prérequis : Node 18 ou plus. Pour l'APK : JDK 17 et le SDK Android (ou laisser la CI le faire).

```bash
npm install
```

```bash
npm run dev
```
Construit l'appli et la sert sur http://localhost:4173 (à ouvrir dans Chrome).

```bash
npm run check
```
Linter, tests unitaires (Vitest) et tests de bout en bout (Playwright, dans Chrome).

```bash
npm run build
```
Écrit l'appli dans `app/src/main/assets/www` (dossier généré, non versionné), puis `./gradlew assembleRelease` produit l'APK.

### Organisation

| Dossier | Contenu |
|---|---|
| `web/src/core` | état, stockage (IndexedDB, générations), sauvegarde zip, nettoyage, dates |
| `web/src/srs` | planification des révisions et file du jour |
| `web/src/notes` | moteur d'encre, éditeur, PDF, fichiers des notes |
| `web/src/views` | écrans (Aujourd'hui, Carnet, Cours, Agenda, Réglages…) |
| `web/src/tools` | vérificateur d'unités, incertitudes, ajustement linéaire |
| `web/public/lib` | pdf.js et pdf-lib (copiés tels quels) |
| `revise/` | l'appli Révise d'origine et son lanceur Windows, en attendant la fusion (phase 1) |
| `app/` | coquille Android (`MainActivity.java` : WebView + pont pour enregistrer des fichiers) |
| `tests/unit`, `tests/e2e` | tests |

### Windows

`revise/launcher/build.ps1` compile `revise/Revise.exe` avec le compilateur C# fourni par Windows (aucune installation). La CI le fait aussi. Le .exe de l'appli fusionnée arrive en phase 1.

## Sécurité

La clé de signature `app/replay.keystore` et son mot de passe sont publics dans ce dépôt (voir AUDIT.md, S1). Ils sont gardés pour que les mises à jour s'installent par-dessus ; leur remplacement est prévu en phase 6.
