BEGIN;

-- Mettre à jour les 3 règles Gimp P3 override existantes
-- P1 = GIMP Opérationnel (ICDL) (résultat du P1 ou P2)
-- Les choix P3 proposés : IA Générative, ICDL SketchUp, TOSA Photoshop Basique

-- Règle 280 : conditionP2 = ILLUSTRATOR Opérationnel (TOSA) → choix = IA GENERATIVE (INKREA)
UPDATE p3_override_rules SET
  "conditionP1" = 'GIMP Opérationnel (ICDL)',
  "conditionP2" = 'ILLUSTRATOR Opérationnel (TOSA)',
  formation1 = 'IA GENERATIVE (INKREA)',
  formation2 = '',
  "parcoursTitle" = 'Création graphique + IA - P3',
  "isActive" = true
WHERE id = 280;

-- Règle 281 : conditionP2 = ILLUSTRATOR Opérationnel (ICDL) → choix = SKETCHUP Opérationnel (ICDL)
UPDATE p3_override_rules SET
  "conditionP1" = 'GIMP Opérationnel (ICDL)',
  "conditionP2" = 'ILLUSTRATOR Opérationnel (ICDL)',
  formation1 = 'SKETCHUP Opérationnel (ICDL)',
  formation2 = '',
  "parcoursTitle" = 'Création visuels 3D - P3',
  "isActive" = true
WHERE id = 281;

-- Règle 282 : conditionP2 = ILLUSTRATOR Opérationnel (ICDL) → choix = PHOTOSHOP Basique (TOSA)
UPDATE p3_override_rules SET
  "conditionP1" = 'GIMP Opérationnel (ICDL)',
  "conditionP2" = 'ILLUSTRATOR Opérationnel (ICDL)',
  formation1 = 'PHOTOSHOP Basique (TOSA)',
  formation2 = '',
  "parcoursTitle" = 'Renforcement Photoshop - P3',
  "isActive" = true
WHERE id = 282;

COMMIT;
