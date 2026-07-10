SELECT id, formation, "conditionP1", "conditionP2", formation1, formation2, "requireTest", "forceChoice", "parcoursTitle", "isActive"
FROM p3_override_rules
WHERE formation = 'Gimp'
ORDER BY id;
