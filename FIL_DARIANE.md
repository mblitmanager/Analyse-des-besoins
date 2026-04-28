# 🗺️ Fil d'Ariane - Projet AOPIA (Analyse des Besoins)

Ce document présente la structure globale et le parcours logique de l'application de positionnement pédagogique.

## 🌟 Objectif du Projet
Transformer l'analyse des besoins en une expérience premium, fluide et automatisée pour orienter les bénéficiaires vers le parcours de formation le plus adapté (Initial, Complémentaire ou 3ème Parcours).

---

## 🛤️ Parcours Utilisateur (User Journey)

### 1️⃣ Phase d'Initialisation (Profiling)
*   **Accueil (`HomeView`)** : Introduction et saisie des informations de base.
*   **Pré-requis (`PrerequisView`)** : Vérification des acquis fondamentaux pour la formation choisie.
*   **Situation & Métier** : Collecte du contexte professionnel pour affiner l'analyse.

### 2️⃣ Phase d'Évaluation (Test Adaptatif)
*   **Positionnement (`PositionnementView`)** :
    *   **P1 (Initial)** : Évaluation du niveau de départ.
    *   **P2 (Complémentaire)** : Approfondissement si le P1 est validé.
    *   **P3 (Spécialisation)** : Shortcut automatisé pour les besoins avancés ou les suites de parcours.
*   **Algorithme Adaptatif** : Le test s'arrête dès qu'un niveau n'est pas validé ou progresse vers l'expertise si les scores sont élevés.

### 3️⃣ Phase de Recommandation (Intelligence Métier)
*   **Analyse des Résultats (`ResultatsView`)** :
    *   Affichage d'un badge dynamique (**P1**, **P1 & P2**, **P2**, **P3**).
    *   Présentation en "Steps" (Étape 1, Étape 2) avec connecteurs visuels.
    *   Analyse des acquis (Points forts vs Besoins de mise à niveau).

### 4️⃣ Phase de Finalisation (Reporting)
*   **Validation Finale (`FinalValidationView`)** : Récapitulatif et signature.
*   **Génération PDF (`PdfService`)** : Rapport détaillé avec scores par niveau et recommandations.
*   **Notification Email (`EmailService`)** : Envoi automatique aux administrateurs et conseillers avec les pièces jointes.

---

## 🏗️ Architecture Technique

### Frontend (Vue.js 3 + Tailwind CSS)
*   **Stores (Pinia)** : Gestion de l'état global et de la logique de workflow.
*   **Composants Premium** : Utilisation d'animations, de micro-interactions et d'un design système épuré.

### Backend (NestJS + PostgreSQL)
*   **Sessions Engine** : Moteur de calcul des recommandations basé sur des règles métier complexes.
*   **PDF Engine** : Service de génération de documents haute fidélité.
*   **Mailer** : Intégration SMTP pour le reporting automatique.

---

## 📂 Structure des Fichiers Clés
*   `frontend/src/views/` : Vues principales du parcours.
*   `backend/src/sessions/` : Cœur de la logique métier et calculs.
*   `backend/src/pdf/` : Templates et logique de génération des rapports.
