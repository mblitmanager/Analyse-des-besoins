SELECT l.label, l."order", f.slug
FROM levels l
JOIN formations f ON l."formationId" = f.id
ORDER BY f.slug, l."order";
