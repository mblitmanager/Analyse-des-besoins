**Compte-Rendu de Réunion**

**Participants :** Alexandre, Tahiana, Herizo (IT Manager) **Objet :** Réforme CPF – Développement d'un outil d'analyse des besoins

**Contexte & Enjeux**

Une réforme réglementaire vient d'être publiée au Journal Officiel, instaurant un plafond de **1 500 € par formation** financée via le Compte Personnel de Formation (CPF). Le panier moyen actuel étant à 3 000 €, les commerciaux devront désormais vendre des **parcours de deux formations** (2 × 1 500 €) plutôt qu'une formation unique.

Cette réforme impose également que l'**analyse des besoins** soit réalisée de manière rigoureuse, traçable et informatisée — c'est une obligation vis-à-vis de la Caisse des Dépôts. Sans adaptation rapide, la survie de l'entreprise est en jeu dans les 4 à 6 mois.

**Décision Principale**

Développement en urgence d'un **outil web de test de positionnement** (mettre provisoirement sur "Wizy Learn"), accessible depuis un lien discret sur les sites Aopia et Like, fonctionnel sur mobile et sur ordinateur.

**Fonctionnement de l'Outil**

**Étape 1 – Identification du bénéficiaire**

* Saisie de : Civilité, Nom, Prénom, Téléphone + Nom du conseiller en formation

**Étape 2 – Test informatique (pré-requis)**

* Toutes les questions affichées sur une seule page
* Le bénéficiaire répond puis valide

**Étape 3 – Choix de la formation souhaitée**

* Liste déroulante des formations disponibles (ex. : Anglais, Excel…)
* Le bénéficiaire ou le commercial sélectionne la formation

**Étape 4 – Test de positionnement (ex. : Anglais)**

* Niveau A1 : 6 questions → 5/6 bonnes réponses = passage au niveau A2
* Niveau A2 : 6 questions → si moins de 5/6 = arrêt du test
* Résultat : proposition automatique de la formation adaptée (ex. : "Anglais Intermédiaire")
* **Seuils de validation par niveau → susceptibles d'évoluer après tests terrain**

**Étape 5 – Validation & Traçabilité**

* Affichage d'une proposition de parcours personnalisée
* Clic sur "Valider" → envoi automatique d'un e-mail structuré contenant : nom, prénom, réponses justes/fausses par niveau, préconisation, date et heure horodatées
* Stockage en base de données obligatoire

**Exigences Techniques**

* Interface **100 % web** (pas d'application mobile), responsive mobile en priorité
* Outil **flexible** : nombre de questions et seuils de réussite paramétrables
* Logos Aopia / Like affichés selon le site d'entrée
* URL discrète, non référencée publiquement
* Envoi des résultats par e-mail à une adresse dédiée (à définir)

**Planning**

| **Échéance** | **Livrable** |
| --- | --- |
| Ce soir | Maquette / version bêta initiale |
| Demain matin | Cahier des charges finalisé (validé avec Alexandre) |
| Lundi matin | Démarrage du développement à plein régime |
| Mercredi/Jeudi | Version opérationnelle complète |
| En semaine | Mise à jour des tarifs et parcours sur les deux sites web (délai : 24-48h) |

**Points en Suspens**

* Contenu des questionnaires (réponses, seuils) → fourni par les formateurs et Cécile Reynal d'ici lundi
* Adresse e-mail de réception des résultats → à définir

**Actions**

* **Herizo** : envoyer un CR de compréhension à Alexandre + rédiger le cahier des charges + démarrer la version bêta
* **Alexandre** : valider le cahier des charges demain matin, transmettre les contenus de formation dès réception
* **Équipe formateurs** : fournir les questionnaires et préconisations pour toutes les formations (objectif : lundi)
* **Un développeur disponible en semaine** pour les modifications urgentes des sites (tarifs, parcours)