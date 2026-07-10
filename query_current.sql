SELECT id, formation, condition, formation1, formation2, "isActive", "isHiddenResult", "hiddenResultType", "order", "parcoursTitle", "explanationMessage"
FROM parcours_rules
WHERE formation NOT LIKE '%Anglais%'
  AND formation NOT LIKE '%Fran%'
  AND formation NOT LIKE '%Word + IA%'
  AND formation NOT LIKE '%Excel + IA%'
  AND formation NOT LIKE '%Mixte%'
ORDER BY formation, "order";
