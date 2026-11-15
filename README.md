# Replay pour Android

Ce dossier contient tout le nécessaire pour fabriquer **Replay.apk**, l'application à installer sur ta tablette.
GitHub la construit gratuitement à ta place : tu n'as rien à installer sur ton ordinateur.

## 1. Mettre le projet sur GitHub (une seule fois)

1. Crée un compte gratuit sur https://github.com (si tu n'en as pas).
2. En haut à droite : **+** → **New repository**. Nom : `replay`. Laisse-le **Public**. Ne coche rien d'autre. **Create repository**.
3. Sur la page qui s'affiche, clique **uploading an existing file**.
4. Glisse **tout le contenu** de ce dossier (y compris le dossier `.github`) dans la page, puis **Commit changes**.

## 2. Attendre la construction (~5 minutes)

- Onglet **Actions** : la construction « Construire l'APK » tourne. Une coche verte = c'est prêt.
- Si c'est une croix rouge, ouvre-la et envoie une capture à Claude.

## 3. Installer sur la tablette

1. Sur la tablette, ouvre `https://github.com/TON-PSEUDO/replay/releases/latest`.
2. Touche **Replay.apk** pour le télécharger.
3. Ouvre le fichier téléchargé. Android te demande d'autoriser Chrome à installer des applications : accepte, puis **Installer**.

## Mettre à jour plus tard

Remplace `app/src/main/assets/www/index.html` sur GitHub par la nouvelle version (**Add file → Upload files**).
Une nouvelle version apparaît dans **Releases** ; installe-la par-dessus : tes données sont conservées.

## À savoir

- Tes problèmes et photos restent **sur la tablette**. Fais une sauvegarde de temps en temps (**Réglages → Exporter une sauvegarde**) : désinstaller l'app efface tout.
- Les boutons Claude (indice, vérification, fiche de révision) ne sont disponibles que dans la version web sur claude.ai.
- Les formules ($...$) et les polices s'affichent mieux quand la tablette a internet.
- Le fichier `app/replay.keystore` signe l'app : garde-le, sinon les mises à jour devront être installées après une désinstallation.
