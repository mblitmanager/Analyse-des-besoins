-- ============================================================
-- Script de mise à jour parcours_rules
-- Généré le 2026-07-08
-- ============================================================
BEGIN;

-- ============================================================
-- DIGCOMP (formation = 'Digitales Compétences')
-- ============================================================

-- ordre 1 : f2 doit être "WORD Basique (TOSA)" (était "Word Basique (TOSA)")
UPDATE parcours_rules SET
  condition = 'Si résultat du test DIGCOMP <= Basique',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'WORD Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Essentiels Digitales Compétences & Word',
  "explanationMessage" = NULL
WHERE id = 394;

-- ordre 2 : correction condition
UPDATE parcours_rules SET
  condition = 'Si résultat du test DIGCOMP <= Basique',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'EXCEL Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Essentiels Digitales Compétences & Excel',
  "explanationMessage" = NULL
WHERE id = 438;

-- ordre 3 : correction condition
UPDATE parcours_rules SET
  condition = 'Si résultat du test DIGCOMP <= Basique',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'PPT Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Essentiels Digital Compétence & PPT',
  "explanationMessage" = NULL
WHERE id = 437;

-- ordre 4 : correction condition + f2
UPDATE parcours_rules SET
  condition = 'Si résultat du test DIGCOMP <= Basique',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'OUTLOOK Opérationnel (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Renforcement Digital Compétence + OUTLOOK',
  "explanationMessage" = NULL
WHERE id = 436;

-- ordre 5 : f2 doit être "Outils Collaboratifs Opérationnel (ICDL)" (pas "Google Opérationnel")
UPDATE parcours_rules SET
  condition = 'Si résultat du test DIGCOMP = Opérationnel',
  formation1 = 'Digitales Compétences Opérationnel (TOSA)',
  formation2 = 'Outils Collaboratifs Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Perfectionnement Digital Compétence + OC',
  "explanationMessage" = NULL
WHERE id = 398;

-- ============================================================
-- WORD (formation = 'Word')
-- ============================================================

-- ordre 1 : OK mais harmoniser condition
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'WORD Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Essentiels Digitales Compétences & WORD',
  "explanationMessage" = NULL
WHERE id = 435;

-- ordre 2 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'WORD Basique (TOSA)',
  formation2 = 'WORD Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Renforcement WORD',
  "explanationMessage" = NULL
WHERE id = 399;

-- ordre 3 : parcoursTitle "Essentiels WORD & EXCEL" -> "Essentiels WORD + EXCEL"
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'WORD Basique (TOSA)',
  formation2 = 'EXCEL Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Essentiels WORD + EXCEL',
  "explanationMessage" = NULL
WHERE id = 439;

-- ordre 4 : too_advanced, isActive=true, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 4,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau WORD est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 482;

-- ordre 5 : alternative isActive=false, isHiddenResult=false
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'WORD Basique (TOSA)',
  formation2 = 'WORD Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Renforcement WORD',
  "explanationMessage" = NULL
WHERE id = 483;

-- ordre 6 : alternative isActive=false
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'WORD Opérationnel (TOSA)',
  formation2 = 'EXCEL Opérationnel (TOSA)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 6,
  "parcoursTitle" = 'Perfectionnement WORD + EXCEL',
  "explanationMessage" = NULL
WHERE id = 484;

-- ============================================================
-- EXCEL (formation = 'Excel')
-- ============================================================

-- ordre 1 : harmoniser condition
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'EXCEL Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Essentiels Digitales Compétences & EXCEL',
  "explanationMessage" = NULL
WHERE id = 442;

-- ordre 2 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'EXCEL Basique (TOSA)',
  formation2 = 'EXCEL Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Renforcement EXCEL',
  "explanationMessage" = NULL
WHERE id = 400;

-- ordre 3 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'WORD Basique (TOSA)',
  formation2 = 'EXCEL Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Essentiels WORD + EXCEL',
  "explanationMessage" = NULL
WHERE id = 443;

-- ordre 4 : condition harmonisée
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'EXCEL Opérationnel (ICDL)',
  formation2 = 'EXCEL Expert (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Expertise EXCEL',
  "explanationMessage" = NULL
WHERE id = 401;

-- ordre 5 : condition harmonisée
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'WORD Opérationnel (TOSA)',
  formation2 = 'EXCEL Opérationnel (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Perfectionnement WORD + EXCEL',
  "explanationMessage" = NULL
WHERE id = 444;

-- ============================================================
-- POWERPOINT (formation = 'PowerPoint')
-- ============================================================

-- ordre 1 : harmoniser condition
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = 'Digitales Compétences Basique (TOSA)',
  formation2 = 'PPT Basique (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Essentiels Digitales Compétences & PPT',
  "explanationMessage" = NULL
WHERE id = 445;

-- ordre 2 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'PPT Basique (TOSA)',
  formation2 = 'PPT Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Renforcement PPT',
  "explanationMessage" = NULL
WHERE id = 402;

-- ordre 3 : too_advanced, isActive=true, f1/f2 à corriger (était PPT Opérationnel TOSA)
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau PowerPoint est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 455;

-- ordre 4 : alternative isActive=false
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'PPT Basique (TOSA)',
  formation2 = 'PPT Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Renforcement PPT',
  "explanationMessage" = NULL
WHERE id = 456;

-- ============================================================
-- WORDPRESS (formation = 'WordPress')
-- ============================================================

-- ordre 1 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'WORDPRESS Basique (TOSA)',
  formation2 = 'WORDPRESS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Renforcement WORDPRESS',
  "explanationMessage" = NULL
WHERE id = 413;

-- ordre 2 : too_advanced, isActive=true, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 2,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau WordPress est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 457;

-- ordre 3 : alternative isActive=false
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'WORDPRESS Basique (TOSA)',
  formation2 = 'WORDPRESS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Renforcement WORDPRESS',
  "explanationMessage" = NULL
WHERE id = 458;

-- ============================================================
-- PHOTOSHOP (formation = 'Photoshop')
-- ============================================================

-- ordre 1 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'PHOTOSHOP Basique (TOSA)',
  formation2 = 'PHOTOSHOP Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Renforcement PHOTOSHOP',
  "explanationMessage" = NULL
WHERE id = 409;

-- ordre 2 : too_advanced, isActive=true, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 2,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau Photoshop est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 459;

-- ordre 3 : alternative isActive=false
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'PHOTOSHOP Basique (TOSA)',
  formation2 = 'PHOTOSHOP Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Renforcement PHOTOSHOP',
  "explanationMessage" = NULL
WHERE id = 460;

-- ============================================================
-- GIMP (formation = 'Gimp')
-- ============================================================

-- ordre 0 : too_weak, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_weak',
  "order" = 0,
  "parcoursTitle" = 'Niveau insuffisant',
  "explanationMessage" = 'Votre niveau GIMP est insuffisant pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 461;

-- ordre 1 : isActive=true (vérifier)
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = 'GIMP Opérationnel (ICDL)',
  formation2 = 'ILLUSTRATOR Opérationnel (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Création Graphique',
  "explanationMessage" = NULL
WHERE id = 462;

-- ordre 2 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'GIMP Opérationnel (ICDL)',
  formation2 = 'ILLUSTRATOR Opérationnel (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Création Graphique',
  "explanationMessage" = NULL
WHERE id = 411;

-- ordre 3 : too_advanced, isActive=true (était false), f1/f2 NULL, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau GIMP est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 463;

-- ordre 4 : alternative isActive=false, isHiddenResult=false, f2=ILLUSTRATOR Opérationnel (ICDL)
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'GIMP Opérationnel (ICDL)',
  formation2 = 'ILLUSTRATOR Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Création Graphique',
  "explanationMessage" = NULL
WHERE id = 464;

-- ============================================================
-- ILLUSTRATOR (formation = 'Illustrator')
-- ============================================================

-- ordre 1 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'ILLUSTRATOR Basique (TOSA)',
  formation2 = 'ILLUSTRATOR Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Renforcement ILLUSTRATOR',
  "explanationMessage" = NULL
WHERE id = 412;

-- ordre 2 : too_advanced, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 2,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau Illustrator est trop avancé. Nous vous proposons d''en choisir une autre.'
WHERE id = 465;

-- ordre 3 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'ILLUSTRATOR Basique (TOSA)',
  formation2 = 'ILLUSTRATOR Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Renforcement ILLUSTRATOR',
  "explanationMessage" = NULL
WHERE id = 466;

-- ============================================================
-- SKETCHUP (formation = 'SketchUp')
-- ============================================================

-- ordre 0 : too_weak, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_weak',
  "order" = 0,
  "parcoursTitle" = 'Niveau insuffisant',
  "explanationMessage" = 'Votre niveau SketchUp est insuffisant pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 467;

-- ordre 1 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Initial',
  formation1 = 'SKETCHUP Opérationnel (ICDL)',
  formation2 = 'GIMP Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Création visuels : 3D / Images',
  "explanationMessage" = NULL
WHERE id = 468;

-- ordre 2 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Basique',
  formation1 = 'SKETCHUP Opérationnel (ICDL)',
  formation2 = 'GIMP Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Création visuels : 3D / Images',
  "explanationMessage" = NULL
WHERE id = 410;

-- ordre 3 : too_advanced, isActive=true (était false), f1/f2 NULL, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau SketchUp est trop avancé. Nous vous proposons d''en choisir une autre.'
WHERE id = 469;

-- ordre 4 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'SKETCHUP Opérationnel (ICDL)',
  formation2 = 'GIMP Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Création visuels : 3D / Images',
  "explanationMessage" = NULL
WHERE id = 470;

-- ============================================================
-- OUTILS COLLABORATIFS GOOGLE (formation = 'Outils Collaboratifs Google')
-- ============================================================

-- ordre 1 : f1 doit être "Outils Collaboratifs Opérationnel (ICDL)" (pas "Google Opérationnel"),
--           f2 = "DOCS Opérationnel (ICDL)" (était "Google Docs Opérationnel (ICDL)")
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Google WORKSPACE (OC & DOCS)',
  "explanationMessage" = NULL
WHERE id = 403;

-- ordre 2 : OK (f1/f2 déjà corrects)
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Google WORKSPACE (OC & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 446;

-- ordre 3 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 3,
  "parcoursTitle" = 'Google WORKSPACE (OC & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 447;

-- ordre 4 : OK
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'Digitales Compétences Opérationnel (TOSA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Google WORKSPACE (OC & Digitales Compétences)',
  "explanationMessage" = NULL
WHERE id = 485;

-- ordre 5 : IA Générative - parcoursTitle corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'IA GENERATIVE (INKREA)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Google WORKSPACE (OC & IA Générative)',
  "explanationMessage" = NULL
WHERE id = 486;

-- ordre 6 : too_advanced (était ordre 4), isActive=true, condition corrigée, explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 6,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau en Outils Collaboratifs est trop avancé. Nous vous proposons d''en choisir une autre.'
WHERE id = 471;

-- ordre 7 : alternative DOCS, condition corrigée
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 7,
  "parcoursTitle" = 'Google WORKSPACE (OC & DOCS)',
  "explanationMessage" = NULL
WHERE id = 404;

-- ordre 8 : alternative SHEETS, condition corrigée
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 8,
  "parcoursTitle" = 'Google WORKSPACE (OC & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 472;

-- ordre 9 : alternative SLIDES, condition corrigée
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'Outils Collaboratifs Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 9,
  "parcoursTitle" = 'Google WORKSPACE (OC & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 405;

-- ordre 10 : Perfectionnement Digital + OC
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'Digitales Compétences Opérationnel (TOSA)',
  formation2 = 'Outils Collaboratifs Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 10,
  "parcoursTitle" = 'Perfectionnement Digital Compétence + OC',
  "explanationMessage" = NULL
WHERE id = 448;

-- ============================================================
-- GOOGLE SHEETS (formation = 'Google Sheets')
-- ============================================================

-- ordre 1 : parcoursTitle et f2 corrigés
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'SHEETS Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Google WORKSPACE (SHEETS & DOCS)',
  "explanationMessage" = NULL
WHERE id = 406;

-- ordre 2 : parcoursTitle corrigé (suppression espace traîlant)
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'SHEETS Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Google WORKSPACE (SHEETS & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 450;

-- ordre 3 : too_advanced, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau Google Sheets est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 473;

-- ordre 4 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'SHEETS Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Google WORKSPACE (SHEETS & DOCS)',
  "explanationMessage" = NULL
WHERE id = 474;

-- ordre 5 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'SHEETS Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Google WORKSPACE (SHEETS & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 475;

-- ============================================================
-- GOOGLE DOCS (formation = 'Google Docs')
-- ============================================================

-- ordre 1 : parcoursTitle corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'DOCS Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Google WORKSPACE (DOCS & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 407;

-- ordre 2 : parcoursTitle corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'DOCS Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Google WORKSPACE (DOCS & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 451;

-- ordre 3 : too_advanced, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau Google Docs est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 476;

-- ordre 4 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'DOCS Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Google WORKSPACE (DOCS & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 477;

-- ordre 5 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'DOCS Opérationnel (ICDL)',
  formation2 = 'SLIDES Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Google WORKSPACE (DOCS & SLIDES)',
  "explanationMessage" = NULL
WHERE id = 478;

-- ============================================================
-- GOOGLE SLIDES (formation = 'Google Slides')
-- ============================================================

-- ordre 1 : parcoursTitle corrigé (suppression espace traîlant)
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'SLIDES Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 1,
  "parcoursTitle" = 'Google WORKSPACE (SLIDES & DOCS)',
  "explanationMessage" = NULL
WHERE id = 408;

-- ordre 2 : parcoursTitle corrigé (suppression espace traîlant)
UPDATE parcours_rules SET
  condition = 'Si résultat du test <= Basique',
  formation1 = 'SLIDES Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = true,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 2,
  "parcoursTitle" = 'Google WORKSPACE (SLIDES & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 449;

-- ordre 3 : too_advanced, isActive=true (était false), explanationMessage corrigé
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = '',
  formation2 = '',
  "isActive" = true,
  "isHiddenResult" = true,
  "hiddenResultType" = 'too_advanced',
  "order" = 3,
  "parcoursTitle" = 'Niveau trop avancé',
  "explanationMessage" = 'Votre niveau Google Slides est trop avancé pour cette formation. Nous vous proposons d''en choisir une autre.'
WHERE id = 479;

-- ordre 4 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'SLIDES Opérationnel (ICDL)',
  formation2 = 'DOCS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 4,
  "parcoursTitle" = 'Google WORKSPACE (SLIDES & DOCS)',
  "explanationMessage" = NULL
WHERE id = 480;

-- ordre 5 : alternative isActive=false, explanationMessage NULL
UPDATE parcours_rules SET
  condition = 'Si résultat du test = Opérationnel',
  formation1 = 'SLIDES Opérationnel (ICDL)',
  formation2 = 'SHEETS Opérationnel (ICDL)',
  "isActive" = false,
  "isHiddenResult" = false,
  "hiddenResultType" = NULL,
  "order" = 5,
  "parcoursTitle" = 'Google WORKSPACE (SLIDES & SHEETS)',
  "explanationMessage" = NULL
WHERE id = 481;

-- ============================================================
-- FIN
-- ============================================================
COMMIT;
