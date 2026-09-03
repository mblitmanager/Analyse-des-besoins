SELECT id, text, niveau, type FROM questions
WHERE formation_id IN (SELECT id FROM formations WHERE label ILIKE '%PowerPoint%')
  AND type = 'positionnement'
  AND niveau ILIKE '%operationnel%'
ORDER BY id;
