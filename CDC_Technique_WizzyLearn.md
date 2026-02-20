**CAHIER DES CHARGES**

**TECHNIQUE**

*Outil Web d'Analyse des Besoins et de Positionnement*

**Plateforme Wizzy Learn**

|  |  |
| --- | --- |
| Destinataire | Tahiana (IT Manager) & équipe développement |
| Version | v1.0 — Draft initial |
| Date | Février 2025 |
| Statut | URGENT — Développement à démarrer lundi |
| Technologies | Web (HTML/CSS/JS + backend + BDD) |

# **1. Architecture Générale**

## **1.1 Vue d'ensemble**

L'application Wizzy Learn est une Single Page Application (SPA) web, responsive mobile-first, accessible via une URL discrète hébergée sur les domaines Aopia et Like. Elle est composée de trois couches :

* Frontend : Interface utilisateur responsive (HTML5 / CSS3 / JavaScript ou framework moderne)
* Backend : API RESTful gérant la logique des tests, les résultats et les envois d'e-mails
* Base de données : Stockage persistant des sessions de test et des résultats

## **1.2 Schéma d'intégration multi-marques**

Un paramètre d'URL (ou sous-domaine) détermine la marque active au chargement. Exemple :

* aopia.fr/positionnement?brand=aopia → logo Aopia, couleurs Aopia
* like-formation.fr/positionnement?brand=like → logo Like, couleurs Like

Le backend reçoit ce paramètre et l'enregistre dans la session. Il est inclus dans le rapport e-mail et la base de données.

# **2. Stack Technique Recommandée**

| **Couche** | **Technologie recommandée** | **Alternatives possibles** |
| --- | --- | --- |
| Frontend | React.js ou Vue.js | HTML/CSS/JS vanilla, Next.js |
| Styling | Tailwind CSS | Bootstrap, CSS custom |
| Backend / API | Node.js + Express | Python (Django/Flask), PHP (Laravel) |
| Base de données | PostgreSQL | MySQL, SQLite (dev), MongoDB |
| ORM | Prisma ou Sequelize | TypeORM, SQLAlchemy |
| E-mail | Nodemailer + SMTP | SendGrid, Mailgun, Resend |
| Hébergement | Serveur existant NS Conseil | Vercel + PlanetScale, Render |

Note : Le choix final de la stack est laissé à l'appréciation de l'IT Manager selon l'environnement existant.

# **3. Modèle de Données**

## **3.1 Table : sessions**

| **Champ** | **Type** | **Contrainte** | **Description** |
| --- | --- | --- | --- |
| id | UUID / INT | PK, auto | Identifiant unique de la session |
| brand | VARCHAR(50) | NOT NULL | Marque : 'aopia' ou 'like' |
| civilite | VARCHAR(10) | NOT NULL | M. ou Mme |
| nom | VARCHAR(100) | NOT NULL | Nom du bénéficiaire |
| prenom | VARCHAR(100) | NOT NULL | Prénom du bénéficiaire |
| telephone | VARCHAR(20) | NOT NULL | Téléphone du bénéficiaire |
| conseiller | VARCHAR(150) | NOT NULL | Nom du conseiller en formation |
| formation\_choisie | VARCHAR(100) | NOT NULL | Formation sélectionnée (ex: anglais) |
| score\_prerequis | JSON / TEXT | NULL | Réponses et scores au test pré-requis |
| niveaux\_passes | JSON / TEXT | NULL | Détail par niveau : réponses, score |
| niveau\_arret | VARCHAR(20) | NULL | Niveau auquel le test s'est arrêté |
| preconisation | VARCHAR(200) | NULL | Formation préconisée par le système |
| created\_at | TIMESTAMP | NOT NULL, auto | Date et heure de création (UTC) |
| email\_sent\_at | TIMESTAMP | NULL | Date et heure d'envoi de l'e-mail |

## **3.2 Table : formations**

| **Champ** | **Type** | **Contrainte** | **Description** |
| --- | --- | --- | --- |
| id | INT | PK, auto | Identifiant unique |
| slug | VARCHAR(50) | UNIQUE | Identifiant URL (ex: anglais, excel) |
| label | VARCHAR(100) | NOT NULL | Libellé affiché (ex: Anglais) |
| actif | BOOLEAN | DEFAULT true | Formation disponible ou non |

## **3.3 Table : niveaux**

| **Champ** | **Type** | **Contrainte** | **Description** |
| --- | --- | --- | --- |
| id | INT | PK, auto | Identifiant unique |
| formation\_id | INT | FK → formations | Formation parente |
| ordre | INT | NOT NULL | Ordre de passage (1, 2, 3...) |
| label | VARCHAR(50) | NOT NULL | Libellé (ex: A1, A2, Intermédiaire) |
| seuil\_reussite | INT | NOT NULL | Nb. de bonnes réponses requis |
| preconisation\_label | VARCHAR(200) | NULL | Texte de la préconisation si arrêt ici |

## **3.4 Table : questions**

| **Champ** | **Type** | **Contrainte** | **Description** |
| --- | --- | --- | --- |
| id | INT | PK, auto | Identifiant unique |
| niveau\_id | INT | FK → niveaux | Niveau parent (ou NULL pour pré-requis) |
| type | ENUM | prerequis / positionnement | Type de question |
| enonce | TEXT | NOT NULL | Texte de la question |
| options | JSON | NOT NULL | Liste des choix possibles (array) |
| reponse\_correcte | INT | NOT NULL | Index de la bonne réponse (0-based) |
| ordre | INT | NOT NULL | Ordre d'affichage |
| actif | BOOLEAN | DEFAULT true | Question active ou désactivée |

# **4. API Backend — Endpoints**

## **4.1 Endpoints principaux**

| **Méthode** | **Route** | **Paramètres / Body** | **Description** |
| --- | --- | --- | --- |
| GET | /api/formations | — | Retourne la liste des formations actives |
| GET | /api/questions | ?type=prerequis | Retourne les questions de pré-requis |
| GET | /api/questions | ?formation=anglais&niveau=A1 | Questions d'un niveau donné |
| POST | /api/sessions | Body JSON : infos bénéficiaire + brand | Crée une nouvelle session |
| PATCH | /api/sessions/:id | Body JSON : résultats étape | Met à jour une session |
| POST | /api/sessions/:id/submit | — | Finalise, calcule préconisation, envoie e-mail |
| GET | /api/sessions/:id | — | Retourne les détails d'une session (admin) |

## **4.2 Logique de calcul de la préconisation**

À la réception du POST /api/sessions/:id/submit, le backend exécute la logique suivante :

* Récupérer les résultats de chaque niveau passé par le bénéficiaire
* Identifier le dernier niveau où le seuil de réussite n'a pas été atteint
* Récupérer le champ preconisation\_label associé à ce niveau dans la table niveaux
* Si tous les niveaux sont réussis → retourner la préconisation du niveau le plus avancé
* Sauvegarder la préconisation dans la session et déclencher l'envoi d'e-mail

# **5. Interface Frontend**

## **5.1 Structure des vues**

| **Vue / Écran** | **Contenu** | **Actions** |
| --- | --- | --- |
| Accueil / Identification | Logo marque, formulaire 5 champs | Valider → lancer test |
| Test pré-requis | Questions sur une page, boutons radio | Valider → écran suivant |
| Sélection formation | Grille de formations cliquables | Clic → test positionnement |
| Test positionnement | Questions par niveau, boutons radio | Valider → niveau suivant ou résultat |
| Résultat | Message personnalisé, préconisation | OK / Valider → envoi e-mail |
| Confirmation | Confirmation de l'envoi | — |

## **5.2 Exigences UX**

* Design mobile-first : boutons larges, texte lisible sans zoom
* Pas de défilement horizontal
* Indicateur de progression visible (ex : « Étape 2/5 »)
* Les réponses ne sont jamais montrées au bénéficiaire après validation
* Interface ludique et rassurante, ton bienveillant
* Chargement rapide : pas de librairies inutiles

# **6. E-mail de Rapport**

## **6.1 Structure du rapport e-mail**

À la validation du test, un e-mail est envoyé automatiquement à l'adresse définie. Il contient les informations suivantes :

* Objet : « Analyse des besoins — [Civilité] [Nom Prénom] — [Date] »
* En-tête : logo de la marque, date et heure horodatées
* Informations bénéficiaire : civilité, nom, prénom, téléphone
* Conseiller en formation associé
* Formation choisie
* Résultats pré-requis : score global
* Résultats par niveau : score, réponses justes / fausses (sans révéler les bonnes réponses)
* Préconisation finale : libellé complet du parcours recommandé

## **6.2 Destinataires**

L'adresse e-mail de réception est à définir par Alexandre. Elle devra être configurable dans les paramètres de l'application sans redéveloppement (variable d'environnement ou table de configuration).

# **7. Sécurité et Confidentialité**

* L'URL de l'outil est non indexée (balise noindex) et non communiquée publiquement
* Pas d'authentification requise pour le bénéficiaire (accès direct via le lien)
* Les données personnelles (nom, téléphone) sont stockées de manière sécurisée (chiffrement recommandé)
* Conformité RGPD : données conservées le temps légal minimum
* Pas d'accès public aux résultats des sessions (endpoint /api/sessions/:id sécurisé)
* Validation des entrées côté serveur (protection injection SQL, XSS)

# **8. Administration et Paramétrisation**

L'outil doit être configurable sans redéveloppement pour les paramètres suivants :

| **Paramètre** | **Méthode de modification** | **Responsable** |
| --- | --- | --- |
| Nombre de questions par niveau | Base de données (table questions) | IT Manager |
| Seuil de réussite | Base de données (table niveaux) | IT Manager |
| Texte de préconisation | Base de données (table niveaux) | Alexandre / Formateurs |
| Ajout de formations | Base de données (table formations) | IT Manager |
| E-mail de réception | Variable d'environnement | IT Manager |
| Logos / couleurs marques | Fichiers de configuration | IT Manager |

# **9. Tests et Recette**

## **9.1 Scénarios de test minimaux**

* Test complet avec bénéficiaire réussissant tous les niveaux → préconisation niveau avancé
* Test complet avec bénéficiaire échouant au niveau 1 → préconisation niveau débutant
* Test complet avec bénéficiaire échouant au niveau 2 → préconisation niveau intermédiaire
* Test sur mobile (iOS Safari, Android Chrome) → vérification responsive
* Vérification de l'e-mail reçu : structure, horodatage, données correctes
* Vérification de l'enregistrement en base de données
* Test avec paramètre brand=aopia et brand=like → logos corrects

## **9.2 Critères d'acceptation**

* L'outil est fonctionnel sur mobile sans défilement horizontal
* Les résultats sont stockés avec date et heure en UTC
* L'e-mail est reçu dans les 30 secondes après validation
* Les seuils et questions sont modifiables sans redéploiement
* L'URL est inaccessible aux moteurs de recherche

# **10. Planning de Développement**

| **Phase** | **Tâches** | **Deadline** | **Responsable** |
| --- | --- | --- | --- |
| Phase 0 | CDC validé, maquette bêta | Ce soir / Demain matin | Tahiana |
| Phase 1 | Structure BDD, API de base, frontend étapes 1-2 | Lundi | Équipe dev |
| Phase 2 | Logique de positionnement, calcul préconisation | Mardi | Équipe dev |
| Phase 3 | Envoi e-mail, multi-marques, responsive mobile | Mercredi | Équipe dev |
| Phase 4 | Tests, recette, déploiement | Jeudi | Tahiana + Alexandre |
| Phase 5 | Intégration Excel et autres formations | Semaine suivante | Équipe dev |

# **11. Approbation**

| **Rôle** | **Nom** | **Signature / Date** |
| --- | --- | --- |
| Commanditaire | Alexandre |  |
| IT Manager | Tahiana (Herizo) |  |