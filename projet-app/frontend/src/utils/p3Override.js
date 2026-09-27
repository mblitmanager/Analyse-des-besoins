import { normalizeParcoursLabel } from "./parcoursLabel.js";

/**
 * P3 override rules (admin > P3 Override): choices imposed for the 3rd parcours
 * depending on the P1 formation and on the P1/P2 parcours already validated.
 * Pure functions, used by FormationSelectionView and by the E2E matrix.
 */

/** Accent/case-insensitive label comparison; one label may contain the other. */
export function labelsMatch(actual, expected) {
  const cleanActual = normalizeParcoursLabel(actual);
  const cleanExpected = normalizeParcoursLabel(expected);
  if (!cleanExpected) return true;
  if (!cleanActual) return false;
  return (
    cleanActual === cleanExpected ||
    cleanActual.includes(cleanExpected) ||
    cleanExpected.includes(cleanActual)
  );
}

export function hasP1P2Conditions(rule) {
  return !!(String(rule?.conditionP1 || "").trim() || String(rule?.conditionP2 || "").trim());
}

export function matchesP1P2(rule, p1, p2) {
  const p1Ok = !String(rule.conditionP1 || "").trim() || labelsMatch(p1, rule.conditionP1);
  const p2Ok = !String(rule.conditionP2 || "").trim() || labelsMatch(p2, rule.conditionP2);
  return p1Ok && p2Ok;
}

/** Whether a rule belongs to the P1 formation (by id when both have one, else by label). */
export function ruleAppliesToFormation(rule, formation) {
  if (!formation) return true;
  if (rule.formationId && formation.id) {
    return Number(rule.formationId) === Number(formation.id);
  }
  return labelsMatch(rule.formation, formation.label);
}

/**
 * Legacy level condition ("= Basique", "≤ Opérationnel"...) compared with the level
 * reached in P1, using the level orders of the P1 formation.
 */
export function levelConditionMatches(condition, levels, userLevelLabel) {
  const condMatch = String(condition || "").match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (!condMatch || !userLevelLabel) return false;

  const operator = condMatch[1].replace("≤", "<=").replace("≥", ">=");
  const targetLevel = (levels || []).find((level) => labelsMatch(level.label, condMatch[2]));
  const userLevel = (levels || []).find((level) => labelsMatch(level.label, userLevelLabel));
  if (!targetLevel || !userLevel) return false;

  const targetOrder = Number(targetLevel.order || 0);
  const userOrder = Number(userLevel.order || 0);
  switch (operator) {
    case "=":
      return userOrder === targetOrder;
    case "<":
      return userOrder < targetOrder;
    case "<=":
      return userOrder <= targetOrder;
    case ">":
      return userOrder > targetOrder;
    case ">=":
      return userOrder >= targetOrder;
    default:
      return false;
  }
}

/**
 * Active rules of the P1 formation that apply, in admin order:
 * - every rule whose conditionP1/conditionP2 match the P1/P2 parcours;
 * - otherwise the rules without P1/P2 conditions, when they have no level
 *   condition or when `levelMatches(rule)` accepts it.
 */
export function findMatchingOverrideRules(rules, formation, { p1 = "", p2 = "", levelMatches = () => false } = {}) {
  const candidates = [...(rules || [])]
    .filter((rule) => rule.isActive !== false && ruleAppliesToFormation(rule, formation))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const p1p2Matches = candidates.filter((rule) => hasP1P2Conditions(rule) && matchesP1P2(rule, p1, p2));
  if (p1p2Matches.length) return p1p2Matches;

  return candidates.filter(
    (rule) => !hasP1P2Conditions(rule) && (!String(rule.condition || "").trim() || levelMatches(rule)),
  );
}

export function testFormationsOf(rule) {
  const tf = rule?.testFormations;
  if (!tf) return [];
  if (Array.isArray(tf)) return tf;
  return typeof tf === "object" ? Object.values(tf) : [];
}

function findFormation(formations, identifier) {
  const idNum = Number(identifier);
  if (!Number.isNaN(idNum) && idNum > 0) {
    const byId = formations.find((f) => f.id === idNum);
    if (byId) return byId;
  }
  const needle = String(identifier).toLowerCase();
  return formations.find((f) => String(f.label || "").toLowerCase().includes(needle)) || null;
}

/** Default of P3_OVERRIDE_PRIORITY: displayed first, in this order. */
export const DEFAULT_PRIORITY = ["Excel", "PowerPoint", "Word"];

/** "a, b ,c" (setting value) -> ["a", "b", "c"]; empty -> default list. */
export function parsePriority(value) {
  const list = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_PRIORITY;
}

/**
 * Choices shown for the matching rules: one per test formation for rules with
 * testFormations (label "formation1 (Test formation)", displayed as formation1),
 * otherwise formation1 and formation2. Duplicates are removed.
 * `formations` are searched in order (e.g. P3 list first, then all active formations).
 *
 * Order (P3_OVERRIDE_ORDER):
 * - "admin": rule order from admin > P3 Override, then the rule's own choices;
 * - "alpha": alphabetical;
 * - "priority" (default): `priority` formations first, in that order, then alphabetical.
 */
export function buildOverrideOptions(rules, formations, { order = "priority", priority = DEFAULT_PRIORITY } = {}) {
  const seen = new Set();
  const options = [];
  const add = (option) => {
    const clean = normalizeParcoursLabel(option.label);
    if (!option.label || seen.has(clean)) return;
    seen.add(clean);
    options.push(option);
  };

  for (const rule of rules || []) {
    const tests = testFormationsOf(rule);
    if (tests.length) {
      for (const identifier of tests) {
        const found = findFormation(formations || [], identifier);
        if (!found) continue;
        const parcoursName = rule.formation1 || rule.formation || "Formation";
        add({ label: `${parcoursName} (${found.label})`, displayLabel: parcoursName, rule, formationId: found.id });
      }
      continue;
    }
    for (const field of ["formation1", "formation2"]) {
      add({ label: String(rule?.[field] || "").trim(), rule });
    }
  }

  if (order === "admin") return options;
  const alphabetical = (a, b) => a.label.localeCompare(b.label, "fr");
  if (order === "alpha") return options.sort(alphabetical);

  const rank = (option) =>
    priority.findIndex((p) => option.label?.toLowerCase().includes(String(p).toLowerCase()));
  return options.sort((a, b) => {
    const aRank = rank(a);
    const bRank = rank(b);
    if (aRank !== -1 && bRank !== -1) return aRank - bRank;
    if (aRank !== -1) return -1;
    if (bRank !== -1) return 1;
    return alphabetical(a, b);
  });
}
