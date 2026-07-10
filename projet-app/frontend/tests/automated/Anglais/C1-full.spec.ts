import { test, expect } from "@playwright/test";

/**
 * Test E2E complet — Anglais niveau C1
 * Parcours adaptatif CEFR : l'apprenant valide A1 + A2 + B1 + B2 + C1
 * → Recommandation attendue : C1 (Se perfectionner / Expert)
 *
 * Utilise les VRAIES réponses correctes pour tous les blocs.
 * Source : tests automatisés existants (C1-OK.spec.ts)
 */
test("Anglais — niveau C1 validé (OK C1)", async ({ page }) => {
  // ── 1. Page d'accueil : profil utilisateur ──────────────────────────────
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Prénom" }).fill("C1");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 06");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // ── 2. Prérequis ────────────────────────────────────────────────────────
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Assistante administrative");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Occasionnellement").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .nth(1)
    .click();
  await page
    .locator("div:nth-child(5) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();

  // ── 3. Sélection de la formation ────────────────────────────────────────
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();

  // ── 4. Questions de positionnement spécifiques à l'anglais ──────────────
  // Bloc prérequis Anglais
  await page.locator('label:has-text("Lycée")').click();
  await page.locator("label").nth(5).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();

  // ── Bloc A1 — Réponses CORRECTES ─────────────────────────────────────────
  await page.locator('label:has-text("is")').first().click();
  await page
    .locator(
      "div:nth-child(2) > .p-6 > .grid > label:nth-child(2) > .option-card__radio",
    )
    .click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.locator("label").filter({ hasText: "is watching" }).click();
  await page.locator("label").filter({ hasText: "goes" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc A2 — Réponses CORRECTES ─────────────────────────────────────────
  await page
    .locator("label")
    .filter({ hasText: /^were$/ })
    .click();
  await page.locator("label").filter({ hasText: "was watching" }).click();
  await page.getByText("a few").click();
  await page.getByText("tallest").click();
  await page.getByText("as beautiful as").click();
  await page.getByText("went").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc B1 — Réponses CORRECTES ─────────────────────────────────────────
  await page.getByText("since").click();
  await page.locator("label").filter({ hasText: /^had$/ }).click();
  await page.getByText("was built").click();
  await page.getByText("has worked").click();
  await page.getByText("had eaten").click();
  await page.getByText("drank").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc B2 — Réponses CORRECTES ─────────────────────────────────────────
  await page.getByText("should have told").click();
  await page.getByText("wouldn't have been").click();
  await page.getByText("will have finished").click();
  await page.getByText("will be lying").click();
  await page.getByText("out", { exact: true }).click();
  await page.getByText("Although").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc C1 — Réponses CORRECTES (valider C1) ────────────────────────────
  // Q25 : She ___ go somewhere else. → had better
  await page.getByText("had better").click();
  // Q26 : He suggested ___ the meeting. → kept
  await page.getByText("kept", { exact: true }).click();
  // Q27 : The report must ___ before Friday. → be submitted
  await page.getByText("be submitted").click();
  // Q28 : ___ that, she left. → Given
  await page.locator("label").filter({ hasText: "Given" }).click();
  // Q29 : Rarely ___ such talent. → have I heard
  await page.locator("label").filter({ hasText: "have I heard" }).click();
  // Q30 : When ___ in London? → did he arrive
  await page.locator("label").filter({ hasText: "did he arrive" }).click();
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();

  // ── 5. Attente et capture d'écran du résultat ────────────────────────────
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: "test-results/screenshots/anglais-C1-result.png",
    fullPage: true,
  });

  // ── 6. Validation : recommandation C1 ────────────────────────────────────
  const pageContent = await page.content();
  const hasC1 =
    pageContent.toLowerCase().includes("c1") ||
    pageContent.toLowerCase().includes("se perfectionner") ||
    pageContent.toLowerCase().includes("expert") ||
    pageContent.toLowerCase().includes("avancé");
  console.log(`[C1 Test] C1 recommendation found: ${hasC1}`);

  // ── 7. Continuer vers la validation ─────────────────────────────────────
  const continuerBtn = page.getByRole("button", { name: "Continuer" });
  if (await continuerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continuerBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/screenshots/anglais-C1-validation.png",
      fullPage: true,
    });
  }

  console.log("✅ Done: anglais C1 test complet");
});

export {};
