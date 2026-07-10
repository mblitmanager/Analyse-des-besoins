SELECT id, formation, condition, formation1, formation2, "isActive", "isHiddenResult", "hiddenResultType", "order", "parcoursTitle"
FROM parcours_rules
ORDER BY formation, "order";