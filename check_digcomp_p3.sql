SELECT id, formation, "conditionP1", "conditionP2", formation1, formation2, "requireTest", "parcoursTitle"
FROM p3_override_rules
WHERE formation ILIKE '%Digit%' OR formation ILIKE '%Compet%'
ORDER BY id;
