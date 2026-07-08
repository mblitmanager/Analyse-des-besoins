-- ============================================================
-- ACTUALISATION DES PARCOURS BUREAUTIQUE - AB 02.07.2026
-- ============================================================
-- Règle générale : le niveau Initial n'est plus proposé en
-- recommandation. Les parcours démarrent au niveau Basique.
-- Le niveau Initial reste dans les QCM uniquement.
--
-- Légende isActive :
--   true  = parcours actif affiché normalement
--   false = parcours désactivé (trop avancé / trop faible)
--           visible en backoffice, non proposé à l'apprenant
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DIGCOMP (formation: "Digitales Compétences")
-- ============================================================
-- Condition <= Basique : 4 parcours (WORD, EXCEL, PPT, OUTLOOK)
-- Correction formation2 OUTLOOK : Basique -> Opérationnel (spec)

UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digitales Compétences & Word',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA WORD Basique',
  "isActive" = true,
  "order" = 1
WHERE id = 394;

UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digitales Compétences & Excel',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA EXCEL Basique',
  "isActive" = true,
  "order" = 2
WHERE id = 438;

UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digital Compétence & PPT',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA PPT Basique',
  "isActive" = true,
  "order" = 3
WHERE id = 437;

UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement Digital Compétence + OUTLOOK',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA Outlook Opérationnel',
  "isActive" = true,
  "order" = 4
WHERE id = 436;

-- Condition = Opérationnel : Perfectionnement DC + OC
UPDATE parcours_rules SET
  "parcoursTitle" = 'Perfectionnement Digital Compétence + OC',
  "formation1" = 'TOSA Digcomp Opérationnel',
  "formation2" = 'ICDL Outils Collaboratifs Opérationnel',
  "isActive" = true,
  "order" = 5
WHERE id = 398;

-- ============================================================
-- 2. WORD (formation: "Word")
-- ============================================================
-- condition <= Initial (ordre 1) : Essentiels DC & WORD
UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digitales Compétences & WORD',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA WORD Basique',
  "isActive" = true,
  "order" = 1
WHERE id = 435;

-- condition = Basique (ordre 2) : Renforcement WORD (existant id 399, changer ordre)
UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement WORD',
  "formation1" = 'TOSA WORD Basique',
  "formation2" = 'ICDL WORD Opérationnel',
  "isActive" = true,
  "order" = 2
WHERE id = 399;

-- condition = Basique (ordre 3) : Essentiels WORD + EXCEL (existant id 439)
UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels WORD + EXCEL',
  "formation1" = 'TOSA WORD Basique',
  "formation2" = 'TOSA EXCEL Basique',
  "isActive" = true,
  "order" = 3
WHERE id = 439;

-- condition = Opérationnel (ordre 4) : trop avancé - désactivé (existant id 441)
UPDATE parcours_rules SET
  "parcoursTitle" = 'Niveau trop avancé',
  "condition" = 'Si résultat du test = Opérationnel',
  "formation1" = 'TOSA WORD Opérationnel',
  "formation2" = 'TOSA EXCEL Opérationnel',
  "isActive" = false,
  "order" = 4,
  "explanationMessage" = 'Votre niveau WORD est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
WHERE id = 441;

-- condition = Opérationnel (ordre 5) : Renforcement WORD si veut quand même - NOUVEAU
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Word',
  'Si résultat du test = Opérationnel',
  'TOSA WORD Basique',
  'ICDL WORD Opérationnel',
  false,
  5,
  'Renforcement WORD',
  'Si le bénéficiaire souhaite tout de même suivre une formation WORD.'
);

-- condition = Opérationnel (ordre 6) : Perfectionnement WORD + EXCEL si veut quand même - NOUVEAU
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Word',
  'Si résultat du test = Opérationnel',
  'TOSA WORD Opérationnel',
  'TOSA EXCEL Opérationnel',
  false,
  6,
  'Perfectionnement WORD + EXCEL',
  'Si le bénéficiaire souhaite tout de même suivre une formation WORD avancée.'
);

-- ============================================================
-- 3. EXCEL (formation: "Excel")
-- ============================================================
-- condition <= Initial (ordre 1) : Essentiels DC & EXCEL
UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digitales Compétences & EXCEL',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA EXCEL Basique',
  "isActive" = true,
  "order" = 1
WHERE id = 442;

-- condition = Basique (ordre 2) : Renforcement EXCEL
UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement EXCEL',
  "formation1" = 'TOSA EXCEL Basique',
  "formation2" = 'ICDL EXCEL Opérationnel',
  "isActive" = true,
  "order" = 2
WHERE id = 400;

-- condition = Basique (ordre 3) : Essentiels WORD + EXCEL
UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels WORD + EXCEL',
  "formation1" = 'TOSA WORD Basique',
  "formation2" = 'TOSA EXCEL Basique',
  "isActive" = true,
  "order" = 3
WHERE id = 443;

-- condition = Opérationnel (ordre 4) : Expertise EXCEL
UPDATE parcours_rules SET
  "parcoursTitle" = 'Expertise EXCEL',
  "formation1" = 'ICDL EXCEL Opérationnel',
  "formation2" = 'TOSA EXCEL Expert',
  "isActive" = true,
  "order" = 4
WHERE id = 401;

-- condition = Opérationnel (ordre 5) : Perfectionnement WORD + EXCEL
UPDATE parcours_rules SET
  "parcoursTitle" = 'Perfectionnement WORD + EXCEL',
  "formation1" = 'TOSA WORD Opérationnel',
  "formation2" = 'TOSA EXCEL Opérationnel',
  "isActive" = true,
  "order" = 5
WHERE id = 444;

-- ============================================================
-- 4. POWERPOINT (formation: "PowerPoint")
-- ============================================================
-- condition <= Initial (ordre 1) : Essentiels DC & PPT
UPDATE parcours_rules SET
  "parcoursTitle" = 'Essentiels Digitales Compétences & PPT',
  "formation1" = 'TOSA Digcomp Basique',
  "formation2" = 'TOSA PPT Basique',
  "isActive" = true,
  "order" = 1
WHERE id = 445;

-- condition <= Basique (ordre 2) : Renforcement PPT
UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement PPT',
  "formation1" = 'TOSA PPT Basique',
  "formation2" = 'ICDL PPT Opérationnel',
  "isActive" = true,
  "order" = 2
WHERE id = 402;

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'PowerPoint',
  'Si résultat du test = Opérationnel',
  'TOSA PPT Opérationnel',
  'ICDL PPT Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau PowerPoint est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Renforcement PPT si veut quand même - NOUVEAU
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'PowerPoint',
  'Si résultat du test = Opérationnel',
  'TOSA PPT Basique',
  'ICDL PPT Opérationnel',
  false,
  4,
  'Renforcement PPT',
  'Si le bénéficiaire souhaite tout de même suivre une formation PowerPoint.'
);

-- ============================================================
-- 5. WORDPRESS (formation: "WordPress")
-- ============================================================
-- condition <= Basique (ordre 1) : Renforcement WORDPRESS
UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement WORDPRESS',
  "formation1" = 'TOSA WORDPRESS Basique',
  "formation2" = 'ICDL WORDPRESS Opérationnel',
  "isActive" = true,
  "order" = 1
WHERE id = 413;

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'WordPress',
  'Si résultat du test = Opérationnel',
  'TOSA WORDPRESS Basique',
  'ICDL WORDPRESS Opérationnel',
  false,
  2,
  'Niveau trop avancé',
  'Votre niveau WordPress est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Renforcement WORDPRESS si veut quand même - NOUVEAU
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'WordPress',
  'Si résultat du test = Opérationnel',
  'TOSA WORDPRESS Basique',
  'ICDL WORDPRESS Opérationnel',
  false,
  3,
  'Renforcement WORDPRESS',
  'Si le bénéficiaire souhaite tout de même suivre une formation WordPress.'
);

-- ============================================================
-- 6. PHOTOSHOP (formation: "Photoshop")
-- ============================================================
-- condition <= Basique (ordre 1) : Renforcement PHOTOSHOP
UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement PHOTOSHOP',
  "formation1" = 'TOSA PHOTOSHOP Basique',
  "formation2" = 'ICDL PHOTOSHOP Opérationnel',
  "isActive" = true,
  "order" = 1
WHERE id = 409;

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Photoshop',
  'Si résultat du test = Opérationnel',
  'TOSA PHOTOSHOP Basique',
  'ICDL PHOTOSHOP Opérationnel',
  false,
  2,
  'Niveau trop avancé',
  'Votre niveau Photoshop est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Renforcement PHOTOSHOP si veut quand même - NOUVEAU
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Photoshop',
  'Si résultat du test = Opérationnel',
  'TOSA PHOTOSHOP Basique',
  'ICDL PHOTOSHOP Opérationnel',
  false,
  3,
  'Renforcement PHOTOSHOP',
  'Si le bénéficiaire souhaite tout de même suivre une formation Photoshop.'
);

-- ============================================================
-- 7. GIMP (formation: "Gimp")
-- ============================================================
-- Existant id 411 : condition <= Basique -> Création graphique (ok)
-- Ajout : condition <= Initial trop faible (désactivé) + Création graphique (actif)
-- Ajout : condition = Basique -> Création graphique (actif)
-- Ajout : condition = Opérationnel trop avancé (désactivé) + option si veut quand même

-- Mettre à jour existant : condition <= Basique -> ordre 2 maintenant
UPDATE parcours_rules SET
  "parcoursTitle" = 'Création Graphique',
  "formation1" = 'ICDL GIMP Opérationnel',
  "formation2" = 'TOSA ILLUSTRATOR Opérationnel',
  "isActive" = true,
  "order" = 2,
  "condition" = 'Si résultat du test = Basique'
WHERE id = 411;

-- condition <= Initial : trop faible - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Gimp',
  'Si résultat du test <= Initial',
  'ICDL GIMP Opérationnel',
  'TOSA ILLUSTRATOR Opérationnel',
  false,
  0,
  'Niveau insuffisant',
  'Votre niveau GIMP est insuffisant pour cette formation. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même vous lancer.'
);

-- condition <= Initial : Création Graphique proposé quand même - NOUVEAU (actif)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Gimp',
  'Si résultat du test <= Initial',
  'ICDL GIMP Opérationnel',
  'TOSA ILLUSTRATOR Opérationnel',
  true,
  1,
  'Création Graphique',
  NULL
);

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Gimp',
  'Si résultat du test = Opérationnel',
  'ICDL GIMP Opérationnel',
  'ICDL ILLUSTRATOR Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau GIMP est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Création Graphique si veut quand même - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Gimp',
  'Si résultat du test = Opérationnel',
  'ICDL GIMP Opérationnel',
  'ICDL ILLUSTRATOR Opérationnel',
  false,
  4,
  'Création Graphique',
  'Si le bénéficiaire souhaite tout de même suivre une formation GIMP.'
);

-- ============================================================
-- 8. ILLUSTRATOR (formation: "Illustrator")
-- ============================================================
-- Existant id 412 : condition <= Basique -> Renforcement Illustrator (ok, mise à jour libellés)

UPDATE parcours_rules SET
  "parcoursTitle" = 'Renforcement ILLUSTRATOR',
  "formation1" = 'TOSA ILLUSTRATOR Basique',
  "formation2" = 'ICDL ILLUSTRATOR Opérationnel',
  "isActive" = true,
  "order" = 1
WHERE id = 412;

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Illustrator',
  'Si résultat du test = Opérationnel',
  'TOSA ILLUSTRATOR Basique',
  'ICDL ILLUSTRATOR Opérationnel',
  false,
  2,
  'Niveau trop avancé',
  'Votre niveau Illustrator est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Renforcement ILLUSTRATOR si veut quand même - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Illustrator',
  'Si résultat du test = Opérationnel',
  'TOSA ILLUSTRATOR Basique',
  'ICDL ILLUSTRATOR Opérationnel',
  false,
  3,
  'Renforcement ILLUSTRATOR',
  'Si le bénéficiaire souhaite tout de même suivre une formation Illustrator.'
);

-- ============================================================
-- 9. SKETCHUP (formation: "SketchUp")
-- ============================================================
-- Existant id 410 : condition <= Basique -> Création visuels 3D/Images
-- On le rebascule en condition = Basique (ordre 2)

UPDATE parcours_rules SET
  "parcoursTitle" = 'Création visuels : 3D / Images',
  "formation1" = 'ICDL SKETCHUP Opérationnel',
  "formation2" = 'ICDL GIMP Opérationnel',
  "isActive" = true,
  "order" = 2,
  "condition" = 'Si résultat du test = Basique'
WHERE id = 410;

-- condition <= Initial : trop faible - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'SketchUp',
  'Si résultat du test <= Initial',
  'ICDL SKETCHUP Opérationnel',
  'ICDL GIMP Opérationnel',
  false,
  0,
  'Niveau insuffisant',
  'Votre niveau SketchUp est insuffisant pour cette formation. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même vous lancer.'
);

-- condition <= Initial : Création visuels proposé quand même - NOUVEAU (actif)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'SketchUp',
  'Si résultat du test <= Initial',
  'ICDL SKETCHUP Opérationnel',
  'ICDL GIMP Opérationnel',
  true,
  1,
  'Création visuels : 3D / Images',
  NULL
);

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'SketchUp',
  'Si résultat du test = Opérationnel',
  'ICDL SKETCHUP Opérationnel',
  'ICDL GIMP Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau SketchUp est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Création visuels si veut quand même - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'SketchUp',
  'Si résultat du test = Opérationnel',
  'ICDL SKETCHUP Opérationnel',
  'ICDL GIMP Opérationnel',
  false,
  4,
  'Création visuels : 3D / Images',
  'Si le bénéficiaire souhaite tout de même suivre une formation SketchUp.'
);

-- ============================================================
-- 10. OUTILS COLLABORATIFS GOOGLE (formation: "Outils Collaboratifs Google")
-- ============================================================
-- Existants <= Basique : ids 403 (OC+DOCS), 446 (OC+SHEETS), 447 (OC+SLIDES)
-- Ajouter condition = Basique manquante pour SLIDES (447 a le mauvais parcoursTitle)

UPDATE parcours_rules SET
  "parcoursTitle" = 'Google WORKSPACE (OC & DOCS)',
  "formation1" = 'ICDL Outils Collaboratifs Opérationnel',
  "formation2" = 'ICDL DOCS Opérationnel',
  "isActive" = true,
  "order" = 1
WHERE id = 403;

UPDATE parcours_rules SET
  "parcoursTitle" = 'Google WORKSPACE (OC & SHEETS)',
  "formation1" = 'ICDL Outils Collaboratifs Opérationnel',
  "formation2" = 'ICDL SHEETS Opérationnel',
  "isActive" = true,
  "order" = 2
WHERE id = 446;

UPDATE parcours_rules SET
  "parcoursTitle" = 'Google WORKSPACE (OC & SLIDES)',
  "formation1" = 'ICDL Outils Collaboratifs Opérationnel',
  "formation2" = 'ICDL SLIDES Opérationnel',
  "isActive" = true,
  "order" = 3
WHERE id = 447;

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Outils Collaboratifs Google',
  'Si résultat du test = Opérationnel',
  'ICDL Outils Collaboratifs Opérationnel',
  'ICDL DOCS Opérationnel',
  false,
  4,
  'Niveau trop avancé',
  'Votre niveau en Outils Collaboratifs est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : Google WORKSPACE (OC & DOCS) si veut quand même (désactivé)
-- Mettre à jour existant id 404
UPDATE parcours_rules SET
  "parcoursTitle" = 'Google WORKSPACE (OC & DOCS)',
  "formation1" = 'ICDL Outils Collaboratifs Opérationnel',
  "formation2" = 'ICDL DOCS Opérationnel',
  "isActive" = false,
  "order" = 5,
  "explanationMessage" = 'Si le bénéficiaire souhaite tout de même suivre une formation Outils Collaboratifs.'
WHERE id = 404;

-- condition = Opérationnel : Google WORKSPACE (OC & SHEETS) si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Outils Collaboratifs Google',
  'Si résultat du test = Opérationnel',
  'ICDL Outils Collaboratifs Opérationnel',
  'ICDL SHEETS Opérationnel',
  false,
  6,
  'Google WORKSPACE (OC & SHEETS)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Outils Collaboratifs.'
);

-- condition = Opérationnel : Google WORKSPACE (OC & SLIDES) si veut quand même
-- Mettre à jour existant id 405
UPDATE parcours_rules SET
  "parcoursTitle" = 'Google WORKSPACE (OC & SLIDES)',
  "formation1" = 'ICDL Outils Collaboratifs Opérationnel',
  "formation2" = 'ICDL SLIDES Opérationnel',
  "isActive" = false,
  "order" = 7,
  "explanationMessage" = 'Si le bénéficiaire souhaite tout de même suivre une formation Outils Collaboratifs.'
WHERE id = 405;

-- condition = Opérationnel : Perfectionnement DC + OC si veut quand même
-- Mettre à jour existant id 448
UPDATE parcours_rules SET
  "parcoursTitle" = 'Perfectionnement Digital Compétence + OC',
  "formation1" = 'TOSA Digcomp Opérationnel',
  "formation2" = 'ICDL Outils Collaboratifs Opérationnel',
  "isActive" = false,
  "order" = 8,
  "explanationMessage" = 'Si le bénéficiaire souhaite tout de même suivre une formation Outils Collaboratifs.'
WHERE id = 448;

-- ============================================================
-- 11. GOOGLE SHEETS (formation: "Google Sheets")
-- ============================================================
-- Existants <= Basique : ids 406 (SHEETS+DOCS), 450 (SHEETS+SLIDES) -> ok
-- Ajout condition = Opérationnel

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Sheets',
  'Si résultat du test = Opérationnel',
  'ICDL SHEETS Opérationnel',
  'ICDL DOCS Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau Google Sheets est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : SHEETS + DOCS si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Sheets',
  'Si résultat du test = Opérationnel',
  'ICDL SHEETS Opérationnel',
  'ICDL DOCS Opérationnel',
  false,
  4,
  'Bureautique Google WORKSPACE (SHEETS & DOCS)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Sheets.'
);

-- condition = Opérationnel : SHEETS + SLIDES si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Sheets',
  'Si résultat du test = Opérationnel',
  'ICDL SHEETS Opérationnel',
  'ICDL SLIDES Opérationnel',
  false,
  5,
  'Bureautique Google WORKSPACE (SHEETS & SLIDES)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Sheets.'
);

-- ============================================================
-- 12. GOOGLE DOCS (formation: "Google Docs")
-- ============================================================
-- Existants <= Basique : ids 407 (DOCS+SHEETS), 451 (DOCS+SLIDES) -> ok
-- Ajout condition = Opérationnel

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Docs',
  'Si résultat du test = Opérationnel',
  'ICDL DOCS Opérationnel',
  'ICDL SHEETS Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau Google Docs est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : DOCS + SHEETS si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Docs',
  'Si résultat du test = Opérationnel',
  'ICDL DOCS Opérationnel',
  'ICDL SHEETS Opérationnel',
  false,
  4,
  'Bureautique Google WORKSPACE (DOCS & SHEETS)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Docs.'
);

-- condition = Opérationnel : DOCS + SLIDES si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Docs',
  'Si résultat du test = Opérationnel',
  'ICDL DOCS Opérationnel',
  'ICDL SLIDES Opérationnel',
  false,
  5,
  'Bureautique Google WORKSPACE (DOCS & SLIDES)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Docs.'
);

-- ============================================================
-- 13. GOOGLE SLIDES (formation: "Google Slides")
-- ============================================================
-- Existants <= Basique : ids 408 (SLIDES+DOCS), 449 (SLIDES+SHEETS) -> ok
-- Ajout condition = Opérationnel

-- condition = Opérationnel : trop avancé - NOUVEAU (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Slides',
  'Si résultat du test = Opérationnel',
  'ICDL SLIDES Opérationnel',
  'ICDL DOCS Opérationnel',
  false,
  3,
  'Niveau trop avancé',
  'Votre niveau Google Slides est déjà avancé. Cette formation ne correspond pas à votre profil. Nous vous invitons à choisir une formation plus adaptée ou à continuer ci-dessous si vous souhaitez tout de même suivre ce parcours.'
);

-- condition = Opérationnel : SLIDES + DOCS si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Slides',
  'Si résultat du test = Opérationnel',
  'ICDL SLIDES Opérationnel',
  'ICDL DOCS Opérationnel',
  false,
  4,
  'Bureautique Google WORKSPACE (SLIDES & DOCS)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Slides.'
);

-- condition = Opérationnel : SLIDES + SHEETS si veut quand même (désactivé)
INSERT INTO parcours_rules (formation, condition, formation1, formation2, "isActive", "order", "parcoursTitle", "explanationMessage")
VALUES (
  'Google Slides',
  'Si résultat du test = Opérationnel',
  'ICDL SLIDES Opérationnel',
  'ICDL SHEETS Opérationnel',
  false,
  5,
  'Bureautique Google WORKSPACE (SLIDES & SHEETS)',
  'Si le bénéficiaire souhaite tout de même suivre une formation Google Slides.'
);

-- ============================================================
-- FIN DE LA MISE À JOUR
-- ============================================================
COMMIT;
