<!-- copy of USER_MANUAL.md for site -->
# Manuel d'utilisation - Frontend WiziLearn (NS Conseil)

## 1. Introduction
Ce manuel décrit l'utilisation de l'interface web côté utilisateur et les opérations courantes pour les administrateurs.

## 2. Accès
- URL publique: `https://nsconseil.mbl-service.com`
- Pour les administrateurs: accéder au panneau admin via la route `/admin` (authentification requise).

## 3. Utilisation pour un apprenant
### 3.1 Débuter
- Sur la page d'accueil, cliquer sur "Commencer" ou "S'inscrire".
- Remplir les informations personnelles demandées (nom, prénom, email, etc.).

### 3.2 Sélection de la formation
- Choisir la formation souhaitée et le niveau estimé.

### 3.3 Tests
- Prérequis: répondre aux questions courtes; les réponses sont enregistrées.
- Positionnement: test principal qui calcule le `scorePretest` — c'est ce score qui sert pour la validation finale.
- Questions complémentaires: informations additionnelles (handicap, préférences, etc.).

### 3.4 Disponibilités
- Indiquer créneaux ou dates de disponibilité; permet d'ajuster le planning.

### 3.5 Validation finale
- Vérifier le récapitulatif et cliquer sur "Découvrir mes résultats" pour soumettre.
- Un email de confirmation peut être envoyé (si configuré côté backend).

## 4. Utilisation pour un administrateur
### 4.1 Gestion des questions
- Aller dans l'interface Admin → Questions.
- Créer / éditer / supprimer des questions; vérifier les types (`prerequis`, `positionnement`, `complementary`, `availabilities`).

### 4.2 Gestion des formations
- Ajouter des formations et niveaux via l'onglet Formations.

### 4.3 Sessions et export
- Consulter la liste des sessions et exporter les données nécessaires (CSV / PDF selon implémentation).

## 5. Déploiement rapide (résumé)
- Build frontend: `npm ci && npm run build` dans `projet-app/frontend`.
- Copier le contenu `dist` vers `/var/www/analyse/projet-app/frontend/dist`.
- Backend: `npm ci && npm run build` puis `pm2 restart aopia-backend`.
- Apache doit proxy `/api` vers le backend (ex: `127.0.0.1:3001`). Voir `projet-app/apache-vhost.conf`.

## 6. Résolution des problèmes courants
- Erreur CORS: utiliser `VITE_API_BASE_URL=/api` et rebuild frontend, ou autoriser l'origine côté backend.
- Port occupé: vérifier `ss -ltnp` et changer le port backend si nécessaire.
- Certbot/SSL: vérifier que le port 80 n'est pas bloqué par un autre service; utiliser webroot ` /var/www/letsencrypt` si besoin.

## 7. Contacts & Support
- Pour assistance: envoyer un email à l'administrateur système (ex: `mblitmanager@gmail.com`) ou ouvrir un ticket.
