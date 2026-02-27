-- Seed script: add 'mise à niveau' workflow step and questions
-- UTF-8 encoding: Set client encoding before running this script
SET client_encoding = 'UTF8';

-- Shift existing steps order >= 3 (so positionnement becomes order 4)
UPDATE public.workflow_steps SET "order" = "order" + 1 WHERE "order" >= 3;

-- Insert new workflow step
INSERT INTO public.workflow_steps(code, label, "order", route, "isActive")
VALUES ('MISE_A_NIVEAU', 'Mise à niveau', 3, '/mise-a-niveau', true);

-- Insert global mise_a_niveau questions (category indicates target formation area)
-- Voltaire (French)
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Français langue maternelle ?$$, '["Oui","Non"]', 0, 1, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Étiez-vous à l'aise en dictée à l'école ?$$, '["Pas du tout","Un peu","Moyennement","Tout à fait"]', 0, 2, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Étiez-vous à l'aise en conjugaison (reconnaître les temps, les utiliser) ?$$, '["Pas du tout","Un peu","Moyennement","Tout à fait"]', 0, 3, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Lisez-vous à titre professionnel ?$$, '["Oui","Non"]', 0, 4, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Si oui : Ponctuellement ou Régulièrement ?$$, '["Ponctuellement","Régulièrement"]', 0, 5, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Lisez-vous à titre personnel ?$$, '["Oui","Non"]', 0, 6, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Si oui : quels types d'ouvrages ?$$, '["Livres","Magazines","BD","Journaux","Comptes-rendus"]', 0, 7, true, 'mise_a_niveau', 'voltaire', NULL, '{"type":"qcm"}', NULL, 'qcm');

-- Anglais
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Étude de l'anglais jusqu'à :$$, '["Collège","Lycée","Bac + 2","Bac + 5"]', 0, 1, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Utilisation professionnelle de l'anglais ?$$, '["Oui","Non"]', 0, 2, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Si oui : clientèle, collègue, fournisseurs (sélectionnez)$$, '["Clientèle","Collègue","Fournisseurs"]', 0, 3, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Fréquence (professionnelle) :$$, '["Régulier","Ponctuel"]', 0, 4, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Utilisation personnelle de l'anglais ?$$, '["Oui","Non"]', 0, 5, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Si oui : voyages, films/séries, applis, lecture (sélectionnez)$$, '["Voyages","Films/Séries","Applis","Lecture"]', 0, 6, true, 'mise_a_niveau', 'anglais', NULL, '{"type":"qcm"}', NULL, 'qcm');

-- Photoshop / Gimp
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Vous prenez des photos ?$$, '["Régulièrement","Occasionnellement","Jamais"]', 0, 1, true, 'mise_a_niveau', 'photoshop', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Avez-vous déjà retouché des photos ?$$, '["Oui","Non"]', 0, 2, true, 'mise_a_niveau', 'photoshop', NULL, '{"type":"radio_toggle"}', NULL, 'qcm');

-- Sketchup
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Avez-vous déjà dessiné un plan ?$$, '["Oui","Non"]', 0, 1, true, 'mise_a_niveau', 'sketchup', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Avez-vous déjà réalisé un visuel d'ambiance ou maquette ?$$, '["Oui","Non"]', 0, 2, true, 'mise_a_niveau', 'sketchup', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Avez-vous déjà utilisé SketchUp ?$$, '["Oui","Non"]', 0, 3, true, 'mise_a_niveau', 'sketchup', NULL, '{"type":"radio_toggle"}', NULL, 'qcm');

-- Wordpress (objectif principal)
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Quel est l'objectif principal de votre formation ?$$, '["Découvrir l''outil par curiosité","Créer un site vitrine","Créer une boutique en ligne"]', 0, 1, true, 'mise_a_niveau', 'wordpress', NULL, '{"type":"qcm"}', NULL, 'qcm');

-- IA
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Exercez-vous dans les domaines de :$$, '["Assistanat","Secrétariat","Marketing","Communication","RH","Juridique"]', 0, 1, true, 'mise_a_niveau', 'ia', NULL, '{"type":"qcm"}', NULL, 'qcm'),
($$Quelle est votre utilisation de l'IA ?$$, '["Jamais utilisé","Déjà testé","Utilisation régulière"]', 0, 2, true, 'mise_a_niveau', 'ia', NULL, '{"type":"qcm"}', NULL, 'qcm');

-- Illustrator
INSERT INTO public.questions(text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata, "formationId", "responseType") VALUES
($$Avez-vous des connaissances en dessin ?$$, '["Oui","Non"]', 0, 1, true, 'mise_a_niveau', 'illustrator', NULL, '{"type":"radio_toggle"}', NULL, 'qcm'),
($$Avez-vous déjà utilisé un logiciel de dessin ?$$, '["Oui","Non"]', 0, 2, true, 'mise_a_niveau', 'illustrator', NULL, '{"type":"radio_toggle"}', NULL, 'qcm');

-- Note: these inserts create global (formationId=NULL) mise_a_niveau questions. 
-- Admin can link or create formation-specific questions via the admin interface.
