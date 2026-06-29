-- Check Anglais formation levels
SELECT * FROM levels WHERE "formationId" = 25 ORDER BY "order";

-- Check P3 filter rules
SELECT id, name, "sourceSlugs", "maxLevelOrder", "levelOperator", "filterMode", "targetSlugs", "targetCategories", "isActive" FROM p3_filter_rule;

-- Check recent completed sessions for Anglais (last 10)
SELECT id, nom, "formationChoisie", "stopLevel", "stopLevelOrder", "lastValidatedLevel", "isCompleted", "isP3Mode"
FROM sessions 
WHERE "formationChoisie" ILIKE '%anglais%' AND "isCompleted" = true
ORDER BY "createdAt" DESC
LIMIT 10;
