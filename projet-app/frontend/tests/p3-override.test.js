import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOverrideOptions,
  findMatchingOverrideRules,
  labelsMatch,
  levelConditionMatches,
  parsePriority,
  ruleAppliesToFormation,
} from "../src/utils/p3Override.js";

const formations = [
  { id: 24, label: "Intelligence Artificielle Générative" },
  { id: 19, label: "Illustrator" },
  { id: 30, label: "SketchUp" },
  { id: 23, label: "Digitales Compétences" },
];

const sketchupRules = [
  { id: 245, formationId: 30, formation: "SketchUp", order: 1, isActive: true, conditionP1: "SketchUp Opérationnel (ICDL)", conditionP2: "Gimp Opérationnel (ICDL)", formation1: "IA Générative (INKREA)", testFormations: [24] },
  { id: 246, formationId: 30, formation: "SketchUp", order: 2, isActive: true, conditionP1: "SketchUp Opérationnel (ICDL)", conditionP2: "Gimp Opérationnel (ICDL)", formation1: "Illustrator Basique (TOSA)", testFormations: [19] },
];

test("labelsMatch ignores accents and case, and accepts inclusion", () => {
  assert.ok(labelsMatch("Word Opérationnel (ICDL)", "word operationnel"));
  assert.ok(labelsMatch("anything", ""));
  assert.ok(!labelsMatch("", "Word"));
  assert.ok(!labelsMatch("Outils Collaboratifs Google Opérationnel (ICDL)", "Outils Collaboratifs (ICDL)"));
});

test("every rule matching P1/P2 is proposed (an IA rule does not hide the others)", () => {
  const matched = findMatchingOverrideRules(sketchupRules, { id: 30, label: "SketchUp" }, {
    p1: "SketchUp Opérationnel (ICDL)",
    p2: "Gimp Opérationnel (ICDL)",
  });
  assert.deepEqual(matched.map((r) => r.id), [245, 246]);
  const options = buildOverrideOptions(matched, formations);
  assert.deepEqual(options.map((o) => o.displayLabel), ["IA Générative (INKREA)", "Illustrator Basique (TOSA)"]);
});

test("rules of another formation never apply", () => {
  const matched = findMatchingOverrideRules(sketchupRules, { id: 23, label: "Digitales Compétences" }, {
    p1: "SketchUp Opérationnel (ICDL)",
    p2: "Gimp Opérationnel (ICDL)",
  });
  assert.deepEqual(matched, []);
  assert.ok(ruleAppliesToFormation({ formation: "SketchUp" }, { id: null, label: "Sketchup" }));
});

test("inactive rules are ignored", () => {
  const rules = [{ ...sketchupRules[0], isActive: false }, sketchupRules[1]];
  const matched = findMatchingOverrideRules(rules, { id: 30 }, { p1: "SketchUp Opérationnel (ICDL)", p2: "Gimp Opérationnel (ICDL)" });
  assert.deepEqual(matched.map((r) => r.id), [246]);
});

test("without P1/P2 match, rules without P1/P2 conditions apply when their level condition holds", () => {
  const rules = [
    { id: 1, formationId: 30, order: 1, isActive: true, formation1: "Toujours" },
    { id: 2, formationId: 30, order: 2, isActive: true, condition: "= Basique", formation1: "Si Basique" },
    { id: 3, formationId: 30, order: 3, isActive: true, conditionP1: "Autre", formation1: "P1P2" },
  ];
  const onlyGeneric = findMatchingOverrideRules(rules, { id: 30 }, { p1: "x", p2: "y" });
  assert.deepEqual(onlyGeneric.map((r) => r.id), [1]);
  const withLevel = findMatchingOverrideRules(rules, { id: 30 }, { p1: "x", p2: "y", levelMatches: () => true });
  assert.deepEqual(withLevel.map((r) => r.id), [1, 2]);
});

test("options: formation1/formation2 without duplicates, Excel/PowerPoint/Word first", () => {
  const options = buildOverrideOptions(
    [
      { formation1: "Outlook Basique (TOSA)", formation2: "Excel Basique (TOSA)" },
      { formation1: "Excel Basique (TOSA)", formation2: "PowerPoint Basique (TOSA)" },
    ],
    formations,
  );
  assert.deepEqual(options.map((o) => o.label), ["Excel Basique (TOSA)", "PowerPoint Basique (TOSA)", "Outlook Basique (TOSA)"]);
});

test("levelConditionMatches compares level orders", () => {
  const levels = [
    { label: "Initial", order: 0 },
    { label: "Basique", order: 1 },
    { label: "Opérationnel", order: 2 },
  ];
  assert.ok(levelConditionMatches("Si résultat = Basique", levels, "Basique"));
  assert.ok(levelConditionMatches("<= Opérationnel", levels, "Initial"));
  assert.ok(!levelConditionMatches(">= Opérationnel", levels, "Basique"));
  assert.ok(!levelConditionMatches("Basique", levels, "Basique"));
});

test("options order: admin rule order, alphabetical, or configured priority", () => {
  const rules = [
    { formation1: "Outlook Basique (TOSA)" },
    { formation1: "Word Basique (TOSA)" },
    { formation1: "Access (TOSA)" },
  ];
  const labels = (order, priority) => buildOverrideOptions(rules, formations, { order, priority }).map((o) => o.label);
  assert.deepEqual(labels("admin"), ["Outlook Basique (TOSA)", "Word Basique (TOSA)", "Access (TOSA)"]);
  assert.deepEqual(labels("alpha"), ["Access (TOSA)", "Outlook Basique (TOSA)", "Word Basique (TOSA)"]);
  assert.deepEqual(labels("priority"), ["Word Basique (TOSA)", "Access (TOSA)", "Outlook Basique (TOSA)"]);
  assert.deepEqual(labels("priority", parsePriority(" Outlook , Word ")), ["Outlook Basique (TOSA)", "Word Basique (TOSA)", "Access (TOSA)"]);
  assert.deepEqual(parsePriority(""), ["Excel", "PowerPoint", "Word"]);
});
