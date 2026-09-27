# Scénarios métier à valider

Scénarios tirés des anciens tests de `tests/automated/`. La colonne **Attendu (configuration actuelle)** est
calculée à partir des règles de parcours en production au 27/09/2026 : elle dit ce que l’application
fait **aujourd’hui**, pas forcément ce que le métier attend.

**Pour valider** : dans la colonne *Validation*, écrivez `OK` si l’attendu est le bon, ou l’attendu correct
(titre du parcours et formations). Les scénarios validés seront joués à chaque campagne (admin > Tests)
avec leur attendu écrit en dur.

Légende : *choix* = plusieurs parcours proposés au candidat ; *trop avancé* = résultat « niveau trop avancé »
(règle masquée) ; ⚠️ = aucun parcours configuré pour ce profil.

## Anglais

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S01 | Échec dès Niveau A1 - TOEIC | "Renforcement Anglais" (A2 & B1) - TOEIC → Niveau A2 - TOEIC & Niveau B1 - TOEIC | Anglais/A1-KO |  |
| S02 | Niveau A1 - TOEIC validé, échec Niveau A2 - TOEIC | "Renforcement Anglais" (A2 & B1) - TOEIC → Niveau A2 - TOEIC & Niveau B1 - TOEIC | Anglais/A1 |  |
| S03 | Niveau A2 - TOEIC validé, échec Niveau B1 - TOEIC | "Renforcement Anglais" (A2 & B1) - TOEIC → Niveau A2 - TOEIC & Niveau B1 - TOEIC | Anglais/A2-full, Anglais/A2, anglais-niveaux (A2) |  |
| S04 | Niveau B1 - TOEIC validé, échec Niveau B2 - TOEIC | "Perfectionnement Anglais" : (B1 & B2) - TOEIC → Niveau B1 - TOEIC & Niveau B2 - TOEIC | Anglais/B1-full, Anglais/B1, anglais-niveaux (B1) |  |
| S05 | Niveau B2 - TOEIC validé, échec Niveau C1 - TOEIC | "Expertise Anglais"  : (B2 & C1) - TOEIC → Niveau B2 - TOEIC & Niveau C1 - TOEIC | Anglais/B2-full, Anglais/AnglaisB2, Anglais/C1-KO, anglais-niveaux (B2) |  |
| S06 | Tous les niveaux réussis | "Expertise Anglais"  : (B2 & C1) - TOEIC → Niveau B2 - TOEIC & Niveau C1 - TOEIC | Anglais/C1-OK (déjà converti), Anglais/C1-full, anglais-niveaux (C1) |  |
| S07 | Prérequis non satisfaits (« Jamais » à « A quelle fréquence utilisez-vous un ordinateur ? ») | Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) *(règle de question)* | Anglais/Anglais-Prerequis-KO |  |

## Digitales Compétences

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S08 | Échec dès Initial | Essentiels Digitales Compétences & Word → Digitales Compétences Basique (TOSA) & Word Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & Excel → Digitales Compétences Basique (TOSA) & Excel Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & PPT → Digitales Compétences Basique (TOSA) & PowerPoint Basique (TOSA)<br>**ou** Renforcement Digitales Compétences & Outlook → Digitales Compétences Basique (TOSA) & Outlook Opérationnel (TOSA) *(choix)* | DigComp/initial-KO |  |
| S09 | Initial validé, échec Basique | Essentiels Digitales Compétences & Word → Digitales Compétences Basique (TOSA) & Word Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & Excel → Digitales Compétences Basique (TOSA) & Excel Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & PPT → Digitales Compétences Basique (TOSA) & PowerPoint Basique (TOSA)<br>**ou** Renforcement Digitales Compétences & Outlook → Digitales Compétences Basique (TOSA) & Outlook Opérationnel (TOSA) *(choix)* | DigComp/initial-O |  |
| S10 | Basique validé, échec Opérationnel | Essentiels Digitales Compétences & Word → Digitales Compétences Basique (TOSA) & Word Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & Excel → Digitales Compétences Basique (TOSA) & Excel Basique (TOSA)<br>**ou** Essentiels Digitales Compétences & PPT → Digitales Compétences Basique (TOSA) & PowerPoint Basique (TOSA)<br>**ou** Renforcement Digitales Compétences & Outlook → Digitales Compétences Basique (TOSA) & Outlook Opérationnel (TOSA) *(choix)* | DigComp/basique |  |
| S11 | Opérationnel validé, échec Avancé | Perfectionnement Digitales Compétences & Outils Coll. → Digitales Compétences Opérationnel (TOSA) & Outils Collaboratifs Google Opérationnel (ICDL) | DigComp/profesionnel |  |
| S12 | Avancé validé, échec Expert | Perfectionnement Digitales Compétences & Outils Coll. → Digitales Compétences Opérationnel (TOSA) & Outils Collaboratifs Google Opérationnel (ICDL) | DigComp/avancé |  |
| S13 | Tous les niveaux réussis | Perfectionnement Digitales Compétences & Outils Coll. → Digitales Compétences Opérationnel (TOSA) & Outils Collaboratifs Google Opérationnel (ICDL) | DigComp/expert |  |
| S14 | Prérequis non satisfaits (« Jamais » à « A quelle fréquence utilisez-vous un ordinateur ? ») | Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) *(règle de question)* | DigComp/Prerequis |  |

## Excel

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S15 | Échec dès Initial | Essentiels Digitales Compétences & EXCEL → Digitales Compétences Basique (TOSA) & Excel Basique (TOSA) | Excel/excel-initial-KO |  |
| S16 | Initial validé, échec Basique | Essentiels Digitales Compétences & EXCEL → Digitales Compétences Basique (TOSA) & Excel Basique (TOSA) | Excel/Excek initial basique, Excel/excel+digcomp |  |
| S17 | Basique validé, échec Opérationnel | Renforcement EXCEL → Excel Basique (TOSA) & Excel Opérationnel (ICDL)<br>**ou** Essentiels WORD & EXCEL → Word Basique (TOSA) & Excel Basique (TOSA) *(choix)* | Excel/Excel basique, Excel/excel-digcomp-Basique |  |
| S18 | Opérationnel validé, échec Avancé | Expertise EXCEL → Excel Opérationnel (ICDL) & Excel Expert (TOSA)<br>**ou** Perfectionnement WORD & EXCEL → Word Opérationnel (TOSA) & Excel Opérationnel (TOSA) *(choix)* | Excel/Excel opérationnel |  |
| S19 | Avancé validé, échec Expert | ⚠️ **Aucun parcours** | Excel/Excel avancé |  |
| S20 | Tous les niveaux réussis | ⚠️ **Aucun parcours** | Excel/Excel Expert |  |

## Google Docs

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S21 | Échec dès Initial | Bureautique Google (Docs + Sheets) → Google Docs Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Bureautique Google (Docs + Slides) → Google Docs Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Docs/Initial-KO, G-Docs/Initial-O |  |
| S22 | Initial validé, échec Basique | Bureautique Google (Docs + Sheets) → Google Docs Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Bureautique Google (Docs + Slides) → Google Docs Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Docs/Initial |  |
| S23 | Basique validé, échec Opérationnel | Bureautique Google (Docs + Sheets) → Google Docs Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Bureautique Google (Docs + Slides) → Google Docs Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Docs/Basique |  |
| S24 | Opérationnel validé, échec Avancé | Bureautique Google (Docs + Sheets) → Google Docs Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Bureautique Google (Docs + Slides) → Google Docs Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Docs/Prof |  |
| S25 | Tous les niveaux réussis | Bureautique Google (Docs + Sheets) → Google Docs Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Bureautique Google (Docs + Slides) → Google Docs Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Docs/Avancé |  |

## Google Sheets

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S26 | Échec dès Initial | Bureautique Google (Sheets + Docs) → Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Sheets + Slides) → Google Sheets Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Sheets/initial-KO, G-Sheets/initial-O |  |
| S27 | Initial validé, échec Basique | Bureautique Google (Sheets + Docs) → Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Sheets + Slides) → Google Sheets Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Sheets/initial |  |
| S28 | Basique validé, échec Opérationnel | Bureautique Google (Sheets + Docs) → Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Sheets + Slides) → Google Sheets Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Sheets/basique |  |
| S29 | Opérationnel validé, échec Avancé | Bureautique Google (Sheets + Docs) → Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Sheets + Slides) → Google Sheets Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Sheets/pro |  |
| S30 | Tous les niveaux réussis | Bureautique Google (Sheets + Docs) → Google Sheets Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Sheets + Slides) → Google Sheets Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | G-Sheets/avancé |  |

## Google Slides

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S31 | Tous les niveaux réussis | Bureautique Google (Slides + Docs) → Google Slides Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Bureautique Google (Slides + Sheets) → Google Slides Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL) *(choix)* | G-Slides/avancé |  |

## Illustrator

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S32 | Basique validé, échec Opérationnel | Renforcement Illustrator → Illustrator Basique (TOSA) & Illustrator Opérationnel (ICDL) | Illustrator (Résultat Basique) |  |
| S33 | Tous les niveaux réussis | ⚠️ **Aucun parcours** | Illustrator/OP |  |
| S34 | Prérequis non satisfaits (« Jamais » à « A quelle fréquence utilisez-vous un ordinateur ? ») | Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) *(règle de question)* | Illustrator (Prereq KO) |  |

## Outils Collaboratifs Google

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S35 | Initial validé, échec Basique | Google WORKSPACE (OC & DOCS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & SHEETS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & SLIDES) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | OutilsColl (Résultat Initial) |  |
| S36 | Basique validé, échec Opérationnel | Google WORKSPACE (OC & DOCS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & SHEETS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & SLIDES) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Slides Opérationnel (ICDL) *(choix)* | OutilsColl (Basique) |  |
| S37 | Opérationnel validé, échec Avancé | Google WORKSPACE (OC & SLIDES) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Slides Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & DOCS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Docs Opérationnel (ICDL)<br>**ou** Google WORKSPACE (OC & SHEETS) → Outils Collaboratifs Google Opérationnel (ICDL) & Google Sheets Opérationnel (ICDL)<br>**ou** Perfectionnement Digitales Compétences + OC → Digitales Compétences Opérationnel (TOSA) & Outils Collaboratifs Google Opérationnel (ICDL) *(trop avancé)* | OutilsColl (Opérationnel) |  |

## PowerPoint

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S38 | Initial validé, échec Basique | Essentiels Digitales Compétences & PPT → Digitales Compétences Basique (TOSA) & PowerPoint Basique (TOSA) | PPT/Initial |  |
| S39 | Prérequis non satisfaits (« Jamais » à « A quelle fréquence utilisez-vous un ordinateur ? ») | Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) *(règle de question)* | PPT/Initial-KO (Prereq KO) |  |

## Français

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S40 | Échec dès Découverte | Renforcement Français → VOLTAIRE Technique & VOLTAIRE Professionnel | français/Découverte, test-1 |  |
| S41 | Découverte validé, échec Technique | Renforcement Français → VOLTAIRE Technique & VOLTAIRE Professionnel | français/Découverte-OK, Voltaire (Résultat Découverte) |  |
| S42 | Technique validé, échec Professionnel | ⚠️ **Aucun parcours** | français/technique, Voltaire (Technique) |  |
| S43 | Professionnel validé, échec Affaires | Perfectionnement Français → VOLTAIRE Professionnel & VOLTAIRE Affaires | français/Professionnel, Voltaire (Professionnel) |  |
| S44 | Tous les niveaux réussis | Perfectionnement Français → VOLTAIRE Professionnel & VOLTAIRE Affaires | français/affaires |  |

## Word

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S45 | Échec dès Initial | Essentiels Digitales Compétences & WORD → Digitales Compétences Basique (TOSA) & Word Basique (TOSA) | Word/Initial-KO-PrerequisOK |  |
| S46 | Initial validé, échec Basique | Essentiels Digitales Compétences & WORD → Digitales Compétences Basique (TOSA) & Word Basique (TOSA) | Word/initial |  |
| S47 | Basique validé, échec Opérationnel | Renforcement WORD → Word Basique (TOSA) & Word Opérationnel (ICDL)<br>**ou** Essentiels WORD & EXCEL → Word Basique (TOSA) & Excel Basique (TOSA) *(choix)* | Word/basique |  |
| S48 | Opérationnel validé, échec Avance | Renforcement WORD → Word Basique (TOSA) & Word Opérationnel (ICDL)<br>**ou** Perfectionnement WORD & EXCEL → WORD Opérationnel (TOSA) & EXCEL Opérationnel (TOSA) *(trop avancé)* | Word/Opérationnel |  |
| S49 | Avance validé, échec Expert | Renforcement WORD → Word Basique (TOSA) & Word Opérationnel (ICDL)<br>**ou** Perfectionnement WORD & EXCEL → WORD Opérationnel (TOSA) & EXCEL Opérationnel (TOSA) *(trop avancé)* | Word/Avancé |  |
| S50 | Tous les niveaux réussis | Renforcement WORD → Word Basique (TOSA) & Word Opérationnel (ICDL)<br>**ou** Perfectionnement WORD & EXCEL → WORD Opérationnel (TOSA) & EXCEL Opérationnel (TOSA) *(trop avancé)* | Word/Expert |  |
| S51 | Prérequis non satisfaits (« Jamais » à « A quelle fréquence utilisez-vous un ordinateur ? ») | Digitales Compétences Basique (TOSA) & Word Basique (TOSA) / Excel Basique (TOSA) / PowerPoint Basique (TOSA) *(règle de question)* | Prerequis/PrerequisKO-q1, Prerequis/Q2 |  |

## WordPress

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S52 | Initial validé, échec Basique | Renforcement Wordpress → WordPress Basique (TOSA) & WordPress Operationnel (ICDL) | WordPress (Résultat Initial) |  |
| S53 | Basique validé, échec Operationnel | Renforcement Wordpress → WordPress Basique (TOSA) & WordPress Operationnel (ICDL) | WordPress (Résultat Basique) |  |

## SketchUp

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S54 | Initial validé, échec Basique | Création visuels : 3D / Images → SketchUp Opérationnel (ICDL) & Gimp Opérationnel (ICDL) | sketchup/Sketchup |  |

## Gimp

| # | Profil du candidat | Attendu (configuration actuelle) | Ancien(s) test(s) | Validation |
|---|---|---|---|---|
| S55 | Initial validé, échec Basique | Création Graphique → Gimp Opérationnel (ICDL) & Illustrator Opérationnel (TOSA) | Gimp/GIMP |  |

## Anciens tests non repris

| Fichier(s) | Raison |
|---|---|
| outlook/* (5 fichiers) | Outlook n'est proposée qu'en P3 : pas de parcours P1/P2 à tester |
| IA/IA2 | Intelligence Artificielle Générative n'est proposée qu'en P3 |
| example.spec, test-2 | exemples génériques de Playwright, sans lien avec l'application |
