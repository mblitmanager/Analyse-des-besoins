**CAHIER DES CHARGES**

**FONCTIONNEL**

*Outil Web d'Analyse des Besoins et de Positionnement*

**Plateforme Wizi Learn**

|  |  |
| --- | --- |
| Rédacteur | Alexandre / NS Conseil |
| Destinataire | Tahiana (IT Manager) & équipe développement |
| Version | v1.0 — Draft initial |
| Date | Février 2025 |
| Statut | URGENT — À valider sous 24h |
| Confidentialité | Document interne — Ne pas diffuser |

# **1. Contexte et Enjeux**

## **1.1 Contexte réglementaire**

Une réforme du Compte Personnel de Formation (CPF) vient d'entrer en vigueur avec publication au Journal Officiel. Elle instaure un plafond maximal de 1 500 € par formation, contre un panier moyen actuel de 3 000 €. Cette contrainte impose une adaptation immédiate du modèle commercial des entreprises Aopia et Like.

## **1.2 Impact sur le modèle commercial**

Les commerciaux ne pourront plus vendre une formation unique. Ils devront désormais vendre des parcours composés de deux formations complémentaires (ex : 2 × 1 500 € = 3 000 €). Exemples de parcours :

* Parcours Anglais : Niveau A1 + Niveau A2 (ou intermédiaire + avancé)
* Parcours Excel : Niveau Intermédiaire + Niveau Avancé
* Parcours Informatique : Prise en main + Bureautique

## **1.3 Obligation de traçabilité**

La réforme impose également que l'analyse des besoins soit réalisée, documentée et traçable pour chaque bénéficiaire. La Caisse des Dépôts peut exiger la preuve que cette analyse a été effectuée avant toute entrée en formation. L'outil doit donc générer des preuves horodatées et conservées.

## **1.4 Enjeux business**

Sans adaptation dans les prochains jours, l'entreprise se retrouvera dans l'incapacité de vendre ses formations. Le risque est la fermeture dans un délai de 4 à 6 mois. L'outil Wizi Learn est une réponse directe et prioritaire à cette contrainte.

# **2. Objectifs du Projet**

## **2.1 Objectif principal**

Développer un outil web de test de positionnement et d'analyse des besoins, accessible depuis les sites Aopia et Like, permettant de qualifier le niveau d'un bénéficiaire et de lui proposer automatiquement un parcours de formation adapté.

## **2.2 Objectifs secondaires**

* Permettre au commercial d'accompagner le bénéficiaire lors du test
* Générer automatiquement une préconisation de parcours de formation
* Assurer la traçabilité complète des réponses avec horodatage
* Conserver les données dans une base de données
* Envoyer un rapport structuré par e-mail après chaque test
* Être utilisable sur mobile dans 90 % des cas

# **3. Description Fonctionnelle**

## **3.1 Vue d'ensemble du parcours utilisateur**

L'outil se décompose en 5 étapes successives, accessibles via un lien unique discret sur chaque site web.

| **Étape** | **Nom** | **Description** |
| --- | --- | --- |
| 1 | Identification | Saisie des informations du bénéficiaire et du conseiller |
| 2 | Test informatique | Évaluation du niveau numérique (pré-requis) |
| 3 | Choix de formation | Sélection de la formation souhaitée dans une liste |
| 4 | Test de positionnement | Quiz progressif par niveau pour la formation choisie |
| 5 | Résultat & Validation | Affichage de la préconisation et envoi du rapport |

## **3.2 Étape 1 — Identification du bénéficiaire**

Avant de démarrer le test, le bénéficiaire renseigne les champs suivants sur une page d'accueil :

* Civilité (Monsieur / Madame) — liste déroulante
* Nom — champ texte
* Prénom — champ texte
* Téléphone — champ texte numérique
* Mon conseiller en formation — champ texte (nom du commercial)

Un bouton « Commencer l'évaluation » (ou libellé équivalent) démarre le test.

## **3.3 Étape 2 — Test informatique (pré-requis)**

Toutes les questions de pré-requis sont affichées sur une seule et même page web. Le bénéficiaire répond à l'ensemble des questions puis clique sur « Valider ». Les réponses ne sont pas visibles par le bénéficiaire après validation.

Ce test évalue le niveau numérique général : fréquence d'utilisation d'un ordinateur, familiarité avec les outils bureautiques, etc.

## **3.4 Étape 3 — Sélection de la formation**

Une page affiche la liste des formations disponibles. Le bénéficiaire (assisté du commercial) clique sur la formation souhaitée. Cette sélection détermine quel test de positionnement sera soumis à l'étape suivante.

Exemple : clic sur « Anglais » → test de positionnement Anglais. Clic sur « Excel » → test de positionnement Excel.

## **3.5 Étape 4 — Test de positionnement**

Le test de positionnement est progressif et adaptatif. Il est composé de niveaux successifs (ex. : A1, A2 pour l'Anglais). Pour chaque niveau :

* Toutes les questions du niveau sont affichées sur une page unique
* Le bénéficiaire répond puis valide
* Si le seuil de réussite est atteint → passage au niveau suivant
* Si le seuil n'est pas atteint → arrêt du test, préconisation générée

Paramètres configurables (par les administrateurs) :

* Nombre de questions par niveau
* Seuil de réussite (ex. : 5 bonnes réponses sur 6)
* Nombre de niveaux

## **3.6 Étape 5 — Résultat et Validation**

À l'issue du test, une page de résultat affiche :

* Le nom et prénom du bénéficiaire
* La formation préconisée (ex. : « Madame Tina, nous vous proposons le Parcours Anglais Intermédiaire »)
* Un bouton « Valider » / « OK » pour confirmer

À la validation :

* Un e-mail structuré est envoyé automatiquement à une adresse définie
* Les données sont enregistrées en base de données avec horodatage

# **4. Gestion Multi-Marques**

L'outil doit fonctionner sous deux marques distinctes : Aopia et Like. Chaque site dispose d'un lien discret vers la plateforme. Selon le lien d'entrée :

* Le logo affiché est celui de la marque correspondante (Aopia ou Like)
* L'URL est identique mais les paramètres d'entrée diffèrent
* Les résultats sont envoyés avec la marque appropriée

L'URL est volontairement non référencée et cachée sur les sites. Seuls les commerciaux y ont accès.

# **5. Contraintes Non Fonctionnelles**

| **Contrainte** | **Détail** |
| --- | --- |
| Compatibilité mobile | Prioritaire — 90 % des utilisateurs sont sur smartphone |
| Technologie | Application web uniquement, pas d'application native |
| Accessibilité URL | Lien discret, non indexé, non public |
| Flexibilité | Paramètres de questions et seuils modifiables sans redéveloppement |
| Traçabilité | Date, heure, réponses, préconisation conservées en base de données |
| Performance | Temps de chargement rapide, compatible connexions mobiles |
| Ergonomie | Interface ludique et engageante pour le bénéficiaire |

# **6. Planning et Jalons**

| **Jalon** | **Deadline** | **Livrable** |
| --- | --- | --- |
| Cahier des charges validé | Demain matin | CDC fonctionnel + technique signé |
| Version bêta | Ce soir / Demain | Maquette fonctionnelle Anglais |
| Démarrage développement | Lundi matin | Sprints de développement |
| Version opérationnelle | Mercredi / Jeudi | Outil déployé et testé |
| Mise à jour sites web | Sous 24-48h en semaine | Tarifs et parcours actualisés |

# **7. Points en Suspens**

* Contenu des questionnaires (réponses, seuils) → fourni par les formateurs et Cécile Reynal avant lundi
* Adresse e-mail de réception des rapports → à définir par Alexandre
* Seuils de validation par niveau → susceptibles d'évoluer après tests terrain
* Liste complète des formations à intégrer → en cours de compilation

# **8. Approbation**

| **Rôle** | **Nom** | **Signature / Date** |
| --- | --- | --- |
| Commanditaire | Alexandre |  |
| IT Manager | Tahiana (Herizo) |  |
| Chef de projet dev | À désigner |  |