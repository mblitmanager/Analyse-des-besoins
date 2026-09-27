import { test, expect, type Page, type TestInfo } from "@playwright/test";
import {
  advanceToFinalValidation,
  apiGet,
  captureCheckpoint,
  continueButton,
  getSessionId,
  loadAnswerKeys,
  runPositionnement,
  startJourney,
} from "./e2e-helpers";

/**
 * Case-by-case journeys generated from the E2E database:
 *   formation × level reached (fail at level k, or pass them all) × parcours choice,
 * each followed by a P3 journey: one case per P3 option imposed by the override rules,
 * or, for a free P3 list, an option that rotates across cases.
 * Screenshots: positionnement, résultats and validation finale, for P1/P2 and P3.
 *
 * Filters: E2E_FORMATIONS=word,excel   E2E_P3=0 (skip the P3 part)
 */

type Level = { id: number; label: string; order: number; isActive?: boolean };
type Formation = { id: number; slug: string; label: string; isActive: boolean; availableInP3Only?: boolean };
type ParcoursRule = {
  id: number;
  formation: string;
  formationId?: number | null;
  condition: string;
  formation1: string;
  formation2: string;
  parcoursTitle: string;
  order: number;
  isActive: boolean;
  isHiddenResult: boolean;
};

type P3OverrideRule = {
  id: number;
  formation: string;
  formationId?: number | null;
  conditionP1?: string | null;
  conditionP2?: string | null;
  formation1?: string | null;
  formation2?: string | null;
  parcoursTitle?: string | null;
  certification?: string | null;
  testFormations?: unknown;
  order?: number;
  isActive: boolean;
};

const onlyFormations = (process.env.E2E_FORMATIONS || "").split(",").map((s) => s.trim()).filter(Boolean);
const runP3 = process.env.E2E_P3 !== "0";

const sameLabel = (a?: string | null, b?: string | null) =>
  String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

// ── Oracle ───────────────────────────────────────────────────────────────────
// "Résultat du test" is the last validated level (the first level if none was
// validated), as the results screen presents it to the candidate.
const cleanLevel = (label: string) => label.replace(/^Niveau\s+/i, "").trim().toUpperCase();
const levelPart = (label: string) => cleanLevel(label).split(/\s*-\s*/)[0].trim();

function ruleMatches(rule: ParcoursRule, levels: Level[], resultIdx: number): boolean {
  const match = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (!match) return false;
  const target = cleanLevel(match[2]);
  const targetIdx = levels.findIndex((l) => levelPart(l.label) === target);
  if (targetIdx === -1) return false;
  switch (match[1].replace("<=", "≤").replace(">=", "≥")) {
    case "=": return resultIdx === targetIdx;
    case "<": return resultIdx < targetIdx;
    case "≤": return resultIdx <= targetIdx;
    case ">": return resultIdx > targetIdx;
    case "≥": return resultIdx >= targetIdx;
    default: return false;
  }
}

// ── Case generation (runs at collection time against the E2E API) ───────────
const formations = (await apiGet<Formation[]>("/formations")).filter(
  (f) => f.isActive && !f.availableInP3Only && (!onlyFormations.length || onlyFormations.includes(f.slug)),
);
const rules = (await apiGet<ParcoursRule[]>("/parcours")).filter((r) => r.isActive);
const allFormations = (await apiGet<Formation[]>("/formations")).filter((f) => f.isActive);
const overrideRules = (await apiGet<P3OverrideRule[]>("/p3-override?activeOnly=true")).filter((r) => r.isActive !== false);

// ── P3 override prediction ──────────────────────────────────────────────────
// Mirrors FormationSelectionView (findMatchingP3OverrideRules + p3OverrideChoiceOptions):
// rules of the P1 formation whose conditionP1/conditionP2 match the P1/P2 formations;
// rules with testFormations take precedence (generative-AI ones first); otherwise
// every formation1/formation2 of the matching rules is proposed.
const normalizeLabel = (value?: string | null) =>
  String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const labelsMatch = (actual: string, expected?: string | null) => {
  const a = normalizeLabel(actual);
  const e = normalizeLabel(expected);
  if (!e) return true;
  if (!a) return false;
  return a === e || a.includes(e) || e.includes(a);
};
const testFormationsOf = (rule: P3OverrideRule): unknown[] => {
  const tf = rule.testFormations;
  if (!tf) return [];
  return Array.isArray(tf) ? tf : typeof tf === "object" ? Object.values(tf as object) : [];
};
const hasP1P2 = (rule: P3OverrideRule) => !!(String(rule.conditionP1 || "").trim() || String(rule.conditionP2 || "").trim());

function prioritize(candidates: P3OverrideRule[]): P3OverrideRule[] {
  const withTests = candidates.filter((r) => testFormationsOf(r).length > 0);
  if (!withTests.length) return candidates;
  const ia = withTests.filter((r) => {
    const label = allFormations.find((f) => f.id === r.formationId)?.label || r.formation || "";
    const text = `${label} ${r.parcoursTitle || ""} ${r.certification || ""}`.toLowerCase();
    return text.includes("ia") || text.includes("intelligence") || text.includes("générative") || text.includes("inkrea");
  });
  return ia.length ? ia : withTests;
}

function predictP3Override(formation: Formation, p1: string, p2: string): string[] | null {
  const forFormation = overrideRules
    .filter((r) => (r.formationId ? Number(r.formationId) === formation.id : labelsMatch(formation.label, r.formation)))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const p1p2 = forFormation.filter((r) => hasP1P2(r) && labelsMatch(p1, r.conditionP1) && labelsMatch(p2, r.conditionP2));
  const withoutP1P2 = forFormation.filter((r) => !hasP1P2(r));
  const matched = p1p2.length ? prioritize(p1p2) : withoutP1P2.length ? prioritize(withoutP1P2) : [];
  if (!matched.length) return null;

  const options: string[] = [];
  const add = (label: string) => {
    if (label && !options.some((o) => normalizeLabel(o) === normalizeLabel(label))) options.push(label);
  };
  for (const rule of matched) {
    const tests = testFormationsOf(rule);
    if (tests.length) {
      for (const id of tests) {
        const found = allFormations.find((f) => f.id === Number(id))
          ?? allFormations.find((f) => f.label.toLowerCase().includes(String(id).toLowerCase()));
        if (found) add(`${rule.formation1 || rule.formation || "Formation"} (${found.label})`);
      }
    } else {
      add(String(rule.formation1 || "").trim());
      add(String(rule.formation2 || "").trim());
    }
  }
  return options;
}

type Case = {
  title: string;
  formation: Formation;
  levels: Level[];
  passCount: number; // levels answered correctly before the first failure
  expectedRules: ParcoursRule[];
  choice?: ParcoursRule;
  p3Rotation: number;
  /** Predicted override proposals (null: free list) and the one this case takes. */
  p3Options: string[] | null;
  p3Option: number;
};

const cases: Case[] = [];
for (const formation of formations) {
  const allLevels = (await apiGet<Level[]>(`/formations/${encodeURIComponent(formation.slug)}/levels`))
    .filter((l) => l.isActive !== false)
    .sort((a, b) => a.order - b.order);
  // Levels without questions are skipped by the quiz and cannot be reached.
  const levels: Level[] = [];
  for (const level of allLevels) {
    const questions = await apiGet<any[]>(
      `/questions/positionnement?formation=${encodeURIComponent(formation.slug)}&niveau=${encodeURIComponent(level.label)}`,
    );
    if (questions.length) levels.push(level);
  }
  if (!levels.length) continue;

  const formationRules = rules
    .filter((r) => (r.formationId ? r.formationId === formation.id : sameLabel(r.formation, formation.label)))
    .sort((a, b) => a.order - b.order);

  for (let passCount = 0; passCount <= levels.length; passCount++) {
    const resultIdx = Math.max(passCount - 1, 0);
    // Hidden rules are the "niveau trop avancé" alternatives, used when no visible rule matches.
    const matching = formationRules.filter((r) => ruleMatches(r, levels, resultIdx));
    const visible = matching.filter((r) => !r.isHiddenResult);
    const expectedRules = visible.length ? visible : matching;
    const outcome = passCount === levels.length ? "tous réussis" : `échec ${levels[passCount].label}`;
    const variants = expectedRules.length > 1 ? expectedRules : [expectedRules[0]];
    variants.forEach((choice, idx) => {
      const base = `${formation.slug} | ${outcome}${variants.length > 1 ? ` | choix ${idx + 1}/${variants.length}` : ""}`;
      const p3Options = choice && runP3
        ? predictP3Override(formation, choice.formation1 || "", choice.formation2 || choice.formation1 || "")
        : null;
      // One case per proposed P3 option; a free list is covered by rotation.
      const p3Variants = p3Options?.length ? p3Options.map((_, i) => i) : [0];
      for (const p3Option of p3Variants) {
        cases.push({
          title: p3Options?.length ? `${base} | P3 ${p3Option + 1}/${p3Options.length} ${p3Options[p3Option]}` : base,
          formation,
          levels,
          passCount,
          expectedRules,
          choice,
          p3Rotation: cases.length,
          p3Options,
          p3Option,
        });
      }
    });
  }
}

// ── Steps ────────────────────────────────────────────────────────────────────
async function selectFormation(page: Page, label: string) {
  // Card text also contains the icon name: match on the label element only.
  const card = page
    .locator(".formation-card")
    .filter({ has: page.locator(".formation-card__label", { hasText: new RegExp(`^\\s*${escapeRegExp(label.trim())}\\s*$`, "i") }) })
    .first();
  await card.waitFor({ state: "visible", timeout: 20_000 });
  await card.click();
  const next = continueButton(page).first();
  await expect(next).toBeEnabled();
  await next.click();
}

async function attachReport(testInfo: TestInfo, report: Record<string, unknown>) {
  console.log(`[matrice] ${testInfo.title} ${JSON.stringify(report)}`);
  await testInfo.attach("rapport.json", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** From the positionnement recommendation screen to the final validation page. */
async function validateResults(page: Page, testInfo: TestInfo, prefix: string, choiceTitle?: string) {
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.waitForURL("**/resultats");
  await expect(page.getByRole("heading", { name: /^Bravo / })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await captureCheckpoint(page, testInfo, `${prefix}-resultats`);
  if (choiceTitle) {
    const choiceButton = page.getByRole("button").filter({ hasText: choiceTitle.trim() }).first();
    if (await choiceButton.isVisible()) await choiceButton.click();
  }
  const validate = page.getByRole("button", { name: /valider ce parcours et continuer/i });
  await expect(validate).toBeEnabled();
  await validate.click();
  await advanceToFinalValidation(page);
  await expect(page.getByText("Votre parcours est maintenant validé", { exact: true })).toBeVisible();
  await captureCheckpoint(page, testInfo, `${prefix}-validation-finale`);
}

test.describe.configure({ mode: "parallel" });

test.describe("Matrice formation × niveau × P3", () => {
  test("la matrice contient des cas", () => {
    expect(cases.length, "aucune formation active avec questions de positionnement").toBeGreaterThan(0);
  });

  for (const c of cases) {
    test(c.title, async ({ page }, testInfo) => {
      test.setTimeout(300_000);
      const report: Record<string, unknown> = {
        formation: c.formation.slug,
        niveauxReussis: c.levels.slice(0, c.passCount).map((l) => l.label),
        reglesAttendues: c.expectedRules.map((r) => r.parcoursTitle),
        regleMasquee: c.expectedRules.some((r) => r.isHiddenResult),
        choix: c.choice?.parcoursTitle ?? null,
      };

      // ── P1/P2 ──
      await startJourney(page, "Matrice", `${c.formation.slug}-${c.passCount}`);
      await selectFormation(page, c.formation.label);

      const keys = await loadAnswerKeys(c.formation.slug);
      const passing = new Set(c.levels.slice(0, c.passCount).map((l) => l.label));
      report.niveauxVus = await runPositionnement(page, keys, (label) => passing.has(label));
      await captureCheckpoint(page, testInfo, "p1-01-positionnement");

      const sessionId = await getSessionId(page);
      const afterQuiz = await apiGet<any>(`/sessions/${sessionId}`);
      const validated = Object.entries<any>(afterQuiz.levelsScores || {})
        .filter(([, e]) => e?.validated)
        .map(([label]) => label)
        .sort();
      expect(validated, "niveaux validés (score recalculé par le serveur)").toEqual([...passing].sort());

      if (!c.choice) {
        // No visible rule for this level: record what the application shows instead.
        report.resultatSansRegle = await page.locator("main").innerText();
        await attachReport(testInfo, report);
        test.info().annotations.push({ type: "sans-regle", description: "Aucune règle de parcours visible pour ce niveau" });
        return;
      }

      for (const rule of c.expectedRules) {
        await expect.soft(page.getByText(rule.parcoursTitle.trim(), { exact: false }).first(), "parcours proposé à l'écran").toBeVisible();
      }

      await validateResults(page, testInfo, "p1-02", c.expectedRules.length > 1 ? c.choice.parcoursTitle : undefined);

      const completed = await apiGet<any>(`/sessions/${sessionId}`);
      report.sessionP1 = {
        parcoursTitle: completed.parcoursTitle,
        finalRecommendation: completed.finalRecommendation,
        stopLevel: completed.stopLevel,
        lastValidatedLevel: completed.lastValidatedLevel,
      };
      expect.soft(completed.parcoursTitle?.trim(), "parcours enregistré").toBe(c.choice.parcoursTitle.trim());
      for (const expectedFormation of [c.choice.formation1, c.choice.formation2].filter((f) => f?.trim())) {
        expect.soft(completed.finalRecommendation || "", "recommandation enregistrée").toContain(expectedFormation.trim());
      }

      // ── P3 ──
      const p3Accept = page.getByRole("button", { name: /oui, avec plaisir/i });
      if (!runP3 || !(await p3Accept.isVisible())) {
        report.p3 = runP3 ? "non proposé" : "désactivé";
        await attachReport(testInfo, report);
        return;
      }
      await p3Accept.click();
      await page.waitForURL("**/formations");
      await expect(page.locator("h1")).toContainText(/3ème/i);

      const overrideModal = page.getByRole("heading", { name: "3ème Parcours - Choix recommandé" });
      const cards = page.locator(".formation-card");
      await Promise.race([
        overrideModal.waitFor({ state: "visible" }),
        cards.first().waitFor({ state: "visible" }),
      ]);
      // The override modal opens after the cards render, once the rules are loaded.
      if (c.p3Options?.length) {
        await overrideModal.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
      } else {
        await page.waitForTimeout(2000);
      }

      let p3Choice: string;
      if (await overrideModal.isVisible()) {
        const modal = page.locator("div.fixed", { has: overrideModal });
        const options = modal.locator("label:has(input), button:not(:has-text('Valider ce choix')):not(:has-text('Choisir manuellement'))");
        // The selected option also renders a "check" icon.
        const labels = (await options.allInnerTexts()).map((t) => t.split("\n")[0].trim()).filter(Boolean);
        report.p3 = { type: "choix imposés", options: labels, prevues: c.p3Options };
        await captureCheckpoint(page, testInfo, "p3-00-choix-imposes");
        expect.soft(
          labels.map(normalizeLabel).sort(),
          "propositions P3 affichées = propositions des règles d'override actives",
        ).toEqual((c.p3Options || []).map(normalizeLabel).sort());
        const predicted = c.p3Options?.[c.p3Option];
        const predictedIdx = predicted ? labels.findIndex((l) => normalizeLabel(l) === normalizeLabel(predicted)) : -1;
        const pick = predictedIdx >= 0 ? predictedIdx : c.p3Rotation % Math.max(labels.length, 1);
        if (labels.length) await options.nth(pick).click();
        p3Choice = labels[pick] || "";
        await modal.getByRole("button", { name: /valider ce choix/i }).click();
      } else {
        const labels = (await page.locator(".formation-card .formation-card__label").allInnerTexts()).map((t) => t.trim());
        const available = await apiGet<Formation[]>(`/sessions/${sessionId}/available-formations-with-p3`);
        const apiLabels = available.map((f) => f.label.trim());
        report.p3 = { type: "liste", options: labels, prevues: c.p3Options };
        expect.soft(c.p3Options, "aucune règle d'override attendue pour une liste libre").toBeNull();
        // "Word + IA", "Excel + IA"... are grouped under the generative-AI card.
        const isIa = (label: string) => /\+\s*IA$|intelligence artificielle/i.test(label);
        expect.soft(
          [...labels.filter((l) => !isIa(l))].sort(),
          "formations P3 affichées = formations autorisées par l'API",
        ).toEqual([...apiLabels.filter((l) => !isIa(l))].sort());
        expect.soft(labels.some(isIa), "groupe IA affiché si l'API autorise une formation IA").toBe(apiLabels.some(isIa));
        await captureCheckpoint(page, testInfo, "p3-00-liste");
        // The generative-AI group only expands sub-choices.
        const selectable = labels.filter((l) => !/intelligence artificielle/i.test(l));
        p3Choice = selectable[c.p3Rotation % selectable.length];
        await selectFormation(page, p3Choice);

        const sameFormationConfirm = page.getByRole("button", { name: /valider mon parcours p3/i });
        const changeFormation = page.getByRole("button", { name: /changer de formation/i });
        await page.waitForTimeout(500);
        if (await sameFormationConfirm.isVisible()) {
          (report.p3 as any).memeFormation = true;
          await sameFormationConfirm.click();
        } else if (await changeFormation.isVisible()) {
          // Same formation already at its highest level: P3 not possible on it.
          (report.p3 as any).memeFormation = "niveau max";
          await changeFormation.click();
          const other = selectable.find((l) => !sameLabel(l, p3Choice) && !sameLabel(l, c.formation.label));
          if (!other) throw new Error("Aucune autre formation P3 disponible");
          p3Choice = other;
          await selectFormation(page, p3Choice);
        }
      }
      (report.p3 as any).choix = p3Choice;

      await page.waitForURL(/\/(mise-a-niveau|positionnement|resultats)$/);
      // The P3 journey may run on a new session.
      const p3SessionId = await getSessionId(page);
      (report.p3 as any).nouvelleSession = p3SessionId !== sessionId;
      if (!page.url().endsWith("/resultats")) {
        const p3Session = await apiGet<any>(`/sessions/${p3SessionId}`);
        const p3Formation = formations.find((f) => sameLabel(f.label, p3Session.formationChoisie))
          ?? (await apiGet<Formation[]>("/formations")).find((f) => sameLabel(f.label, p3Session.formationChoisie));
        if (!p3Formation) throw new Error(`Formation P3 introuvable : ${p3Session.formationChoisie}`);
        const p3Keys = await loadAnswerKeys(p3Formation.slug);
        await runPositionnement(page, p3Keys, () => true);
        await captureCheckpoint(page, testInfo, "p3-01-positionnement");
        await page.getByRole("button", { name: "Continuer", exact: true }).click();
        await page.waitForURL("**/resultats");
      }
      // P3 results recall the P1/P2 parcours, like the final validation page.
      await expect(page.getByRole("heading", { name: /^Bravo / })).toBeVisible();
      await page.waitForLoadState("networkidle");
      const previous = page.getByText("Vos parcours précédents", { exact: true });
      await expect.soft(previous, "P1/P2 rappelés sur les résultats P3").toBeVisible();
      for (const label of [c.choice.formation1, c.choice.formation2].filter((f) => f?.trim())) {
        await expect.soft(
          page.locator("div", { has: previous }).getByText(label.trim(), { exact: false }).first(),
          `P1/P2 « ${label.trim()} » rappelé sur les résultats P3`,
        ).toBeVisible();
      }
      await captureCheckpoint(page, testInfo, "p3-02-resultats");
      const validate = page.getByRole("button", { name: /valider ce parcours et continuer/i });
      await expect(validate).toBeEnabled();
      await validate.click();
      await advanceToFinalValidation(page);
      await expect(page.getByText("Votre parcours est maintenant validé", { exact: true })).toBeVisible();
      await captureCheckpoint(page, testInfo, "p3-03-validation-finale");

      const p3Done = await apiGet<any>(`/sessions/${p3SessionId}`);
      (report.p3 as any).session = {
        isP3Mode: p3Done.isP3Mode,
        formationChoisie: p3Done.formationChoisie,
        parcoursTitle: p3Done.parcoursTitle,
        finalRecommendation: p3Done.finalRecommendation,
      };
      await attachReport(testInfo, report);
    });
  }
});
