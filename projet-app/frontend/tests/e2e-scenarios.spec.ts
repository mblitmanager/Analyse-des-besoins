import { test, expect, type Page } from "@playwright/test";
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
 * Business scenarios ("cahier de recette"): a candidate profile and the parcours the
 * business expects, written explicitly. Unlike the matrix (whose expectations derive
 * from the configured rules), they also catch configuration mistakes, e.g. a parcours
 * rule edited by error in the admin.
 *
 * To add a scenario, append an entry to SCENARIOS. Answers are given by question text
 * and option text (never by position), positionnement answers come from the answer keys.
 */

type Scenario = {
  /** Shown in admin > Tests; the part before " | " is the grouping (formation slug). */
  title: string;
  formation: { slug: string; label: string };
  /** Prerequisite / mise à niveau answers: question text (contained) -> option text. */
  answers?: Record<string, string>;
  /** Positionnement levels answered correctly ("tous" = every level). */
  passLevels: "tous" | string[];
  expected: {
    /** Parcours title saved and displayed (compared without punctuation). */
    parcoursTitle: string;
    /** Formations expected in the saved recommendation. */
    recommendations?: string[];
  };
};

const SCENARIOS: Scenario[] = [
  {
    // From tests/automated/Anglais/C1-OK.spec.ts
    title: "toeic | scénario métier : TOEIC réussi jusqu'au C1",
    formation: { slug: "toeic", label: "Anglais" },
    answers: {
      "Étude de l'anglais jusqu'à": "Lycée",
      "Utilisation professionnelle de l'anglais": "Non",
    },
    passLevels: "tous",
    expected: {
      parcoursTitle: '"Expertise Anglais" : (B2 & C1) - TOEIC',
      recommendations: ["Niveau B2 - TOEIC", "Niveau C1 - TOEIC"],
    },
  },
];

const normalize = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/["'«»():]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Answers the visible questions listed in `answers` (by question and option text). */
async function applyAnswers(page: Page, answers: Record<string, string> = {}) {
  for (const [question, option] of Object.entries(answers)) {
    const label = page.getByText(question, { exact: false }).filter({ visible: true }).first();
    if (!(await label.count())) continue; // question not on this step
    const block = label.locator("xpath=ancestor::div[.//label[contains(@class,'option-card')]][1]");
    await block
      .locator("label.option-card")
      .filter({ hasText: new RegExp(`^\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") })
      .first()
      .click();
  }
}

// Same filter as the matrix (admin > Tests > Lancer une campagne).
const onlyFormations = (process.env.E2E_FORMATIONS || "").split(",").map((v) => v.trim()).filter(Boolean);
const scenarios = SCENARIOS.filter((s) => !onlyFormations.length || onlyFormations.includes(s.formation.slug));

test.describe.configure({ mode: "parallel" });

test.describe("Scénarios métier", () => {
  for (const scenario of scenarios) {
    test(scenario.title, async ({ page }, testInfo) => {
      test.setTimeout(240_000);
      await startJourney(page, "Scenario", scenario.formation.slug);

      await page
        .locator(".formation-card")
        .filter({ has: page.locator(".formation-card__label", { hasText: new RegExp(`^\\s*${scenario.formation.label}\\s*$`, "i") }) })
        .first()
        .click();
      await continueButton(page).first().click();

      // Mise à niveau: scenario answers first, the rest is answered by runPositionnement.
      await page.waitForURL(/\/(mise-a-niveau|positionnement)$/);
      if (page.url().includes("mise-a-niveau")) {
        await expect(continueButton(page)).toBeVisible();
        await applyAnswers(page, scenario.answers);
      }

      const levels = (await apiGet<any[]>(`/formations/${scenario.formation.slug}/levels`)).map((l) => l.label);
      const passing = new Set(scenario.passLevels === "tous" ? levels : scenario.passLevels);
      await runPositionnement(page, await loadAnswerKeys(scenario.formation.slug), (level) => passing.has(level));
      await captureCheckpoint(page, testInfo, "p1-01-positionnement");

      expect
        .soft(normalize(await page.locator("main").innerText()), "parcours attendu à l'écran")
        .toContain(normalize(scenario.expected.parcoursTitle));

      await page.getByRole("button", { name: "Continuer", exact: true }).click();
      await page.waitForURL("**/resultats");
      await expect(page.getByRole("heading", { name: /^Bravo / })).toBeVisible();
      await captureCheckpoint(page, testInfo, "p1-02-resultats");
      await page.getByRole("button", { name: /valider ce parcours et continuer/i }).click();
      await advanceToFinalValidation(page);
      await expect(page.getByText("Votre parcours est maintenant validé", { exact: true })).toBeVisible();
      await captureCheckpoint(page, testInfo, "p1-02-validation-finale");

      const session = await apiGet<any>(`/sessions/${await getSessionId(page)}`);
      const report = {
        formation: scenario.formation.slug,
        attendu: scenario.expected,
        sessionP1: { parcoursTitle: session.parcoursTitle, finalRecommendation: session.finalRecommendation },
      };
      await testInfo.attach("rapport.json", { body: JSON.stringify(report, null, 2), contentType: "application/json" });

      expect(normalize(session.parcoursTitle), "parcours enregistré").toBe(normalize(scenario.expected.parcoursTitle));
      for (const formation of scenario.expected.recommendations || []) {
        expect.soft(session.finalRecommendation || "", "recommandation enregistrée").toContain(formation);
      }
    });
  }
});
