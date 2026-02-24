# Présentation - Frontend WiziLearn (NS Conseil)

## Objectif
Ce frontend fournit l'interface web publique et l'interface d'administration du projet WiziLearn / NS Conseil. Il guide l'utilisateur depuis l'accueil, la sélection de formation, les tests de positionnement et prérequis jusqu'à la validation finale.

## Public cible
- Bénéficiaires (apprenants)
- Formateurs / administrateurs

## Principales fonctionnalités
- Parcours guidé d'inscription et d'évaluation (prérequis, positionnement, questions complémentaires, disponibilités)
- Calcul et affichage du score de positionnement
- Gestion des sessions utilisateur
- Interface d'administration pour gérer questions, formations et sessions
- Export / emailing (via backend)

## Architecture technique
- Frontend: Vue 3 + Vite
- State management: Pinia
- Routing: Vue Router
- Backend: NestJS (API) — communication via `/api` proxied par Apache
- Déploiement: fichiers statiques servis par Apache, backend géré par PM2

## Emplacement des fichiers
- Code frontend: `projet-app/frontend/src`
- Assets publics (logos, favicon): `projet-app/frontend/public`
- Builds: `projet-app/frontend/dist`

## Liens rapides
- Configuration Apache (vhost): `projet-app/apache-vhost.conf`
- Script PM2 backend: `projet-app/backend/ecosystem.config.js`

---
Pour plus de détails techniques et guides utilisateur, consulter le manuel d'utilisation (`USER_MANUAL.md`).
