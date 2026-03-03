-- SQL Import for Tests

BEGIN;

-- Outlook (outlook)
INSERT INTO formations (slug, label) SELECT 'outlook', 'Outlook' WHERE NOT EXISTS (SELECT 1 FROM formations WHERE slug = 'outlook');
DO $$ DECLARE v_fid int; v_lid int; BEGIN
  SELECT id INTO v_fid FROM formations WHERE slug = 'outlook';
  DELETE FROM questions WHERE "formationId" = v_fid AND type = 'positionnement';
  DELETE FROM levels WHERE "formationId" = v_fid;
END $$;

-- Photoshop (photoshop)
INSERT INTO formations (slug, label) SELECT 'photoshop', 'Photoshop' WHERE NOT EXISTS (SELECT 1 FROM formations WHERE slug = 'photoshop');
DO $$ DECLARE v_fid int; v_lid int; BEGIN
  SELECT id INTO v_fid FROM formations WHERE slug = 'photoshop';
  DELETE FROM questions WHERE "formationId" = v_fid AND type = 'positionnement';
  DELETE FROM levels WHERE "formationId" = v_fid;
END $$;

COMMIT;