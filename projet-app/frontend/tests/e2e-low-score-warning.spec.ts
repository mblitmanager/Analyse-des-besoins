import { test, expect, type Page } from "@playwright/test";
import {
  API_BASE_URL,
  advanceToFinalValidation,
  answerPositionnementScreen,
  answerWorkflowStep,
  continueButton,
  getAdminToken,
  loadAnswerKeys,
  runPositionnement,
  startJourney,
} from "./e2e-helpers";

/**
 * "Formation peut-être non adaptée à votre niveau" after a low score on the first level:
 * shown in P1/P2 when LOW_SCORE_WARNING_ENABLED is on, never in P3.
 * Uses Illustrator and SketchUp, whose formations enable the warning.
 */
test.describe.configure({ mode: "serial" });

const warning = (page: Page) => page.getByText("Formation peut-être non adaptée à votre niveau");

async function setWarningEnabled(enabled: boolean) {
  const res = await fetch(`${API_BASE_URL}/settings/LOW_SCORE_WARNING_ENABLED`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAdminToken()}` },
    body: JSON.stringify({ value: String(enabled) }),
  });
  expect(res.ok, "mise à jour du réglage LOW_SCORE_WARNING_ENABLED").toBe(true);
}

async function chooseFormation(page: Page, label: string) {
  await page
    .locator(".formation-card")
    .filter({ has: page.locator(".formation-card__label", { hasText: new RegExp(`^\\s*${label}\\s*$`, "i") }) })
    .first()
    .click();
  await continueButton(page).first().click();
}

/** Fails the first positionnement level and reports whether the warning appeared. */
async function failFirstLevel(page: Page, slug: string) {
  await page.waitForURL(/\/(mise-a-niveau|positionnement)$/);
  if (page.url().includes("mise-a-niveau")) await answerWorkflowStep(page);
  await page.waitForURL("**/positionnement");
  await expect(page.locator("h3.heading-primary").first()).toBeVisible();
  await answerPositionnementScreen(page, await loadAnswerKeys(slug), () => false);
  await page.getByRole("button", { name: /suivant|terminer/i }).click();
  return warning(page)
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true, () => false);
}

test.afterAll(async () => {
  await setWarningEnabled(true);
});

test("P1 : l'avertissement s'affiche après un score faible au 1er niveau", async ({ page }) => {
  await setWarningEnabled(true);
  await startJourney(page, "ScoreFaible", "p1-actif");
  await chooseFormation(page, "Illustrator");
  expect(await failFirstLevel(page, "illustrator")).toBe(true);
});

test("P1 : l'avertissement ne s'affiche pas quand le réglage admin est désactivé", async ({ page }) => {
  await setWarningEnabled(false);
  await startJourney(page, "ScoreFaible", "p1-inactif");
  await chooseFormation(page, "Illustrator");
  expect(await failFirstLevel(page, "illustrator")).toBe(false);
  await setWarningEnabled(true);
});

test("P3 : l'avertissement ne s'affiche jamais", async ({ page }) => {
  test.setTimeout(300_000);
  await setWarningEnabled(true);

  // P1/P2 on SketchUp (first level failed: the warning appears and is dismissed).
  await startJourney(page, "ScoreFaible", "p3");
  await chooseFormation(page, "SketchUp");
  await runPositionnement(page, await loadAnswerKeys("sketchup"), () => false);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.waitForURL("**/resultats");
  await page.getByRole("button", { name: /valider ce parcours et continuer/i }).click();
  await advanceToFinalValidation(page);

  // P3: imposed choice Illustrator Basique (test required), first level failed.
  await page.getByRole("button", { name: /oui, avec plaisir/i }).click();
  const override = page.getByTestId("p3-override");
  await expect(override).toBeVisible();
  await override.getByRole("button", { name: /Illustrator Basique/i }).click();
  await override.getByRole("button", { name: /valider ce choix/i }).click();
  expect(await failFirstLevel(page, "illustrator")).toBe(false);
});
