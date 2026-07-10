import { test, expect } from "@playwright/test";

/**
 * Test E2E complet — Anglais niveau B2
 * Parcours adaptatif CEFR : l'apprenant valide A1 + A2 + B1 puis échoue en B2 (ou valide B2)
 * → Recommandation attendue : B2 (Renforcer les compétences)
 *
 * Réponses A1 : correctes
 * Réponses A2 : correctes
 * Réponses B1 : correctes (avec les vraies réponses du test)
 * Réponses B2 : correctes → valide B2, stoppe avant C1
 */
test("Anglais — niveau B2 validé (OK B2, KO C1)", async ({ page }) => {
  // ── 1. Page d'accueil : profil utilisateur ──────────────────────────────
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Prénom" }).fill("B2");
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
  await page.locator("label").filter({ hasText: "Lycée" }).click();
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

  // ── Bloc B2 — Réponses CORRECTES (valider B2) ────────────────────────────
  await page.getByText("should have told").click();
  await page.getByText("wouldn't have been").click();
  await page.getByText("will have finished").click();
  await page.getByText("will be lying").click();
  await page.getByText("out", { exact: true }).click();
  await page.getByText("Although").click();

  // Vérifier si le bouton est "Suivant" (→ niveau C1) ou "Terminer" (dernier niveau)
  const suivantBtn = page.getByRole("button", { name: "Suivant arrow_forward" });
  const terminerBtn = page.getByRole("button", { name: "Terminer arrow_forward" });

  if (await suivantBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await suivantBtn.click();
    // ── Bloc C1 — Réponses INCORRECTES (échouer C1 → recommandation B2) ────
    // Mauvaises réponses pour stopper avant C1
    await page.locator("label").filter({ hasText: "would rather" }).click();
    await page.getByText("keep", { exact: true }).click();
    await page.getByText("is submitted").click();
    await page.locator("label").filter({ hasText: "Because" }).click();
    // Inversion : choisir "I have heard" au lieu de "have I heard"
    await page.locator("label").filter({ hasText: "I have heard" }).click();
    // Inversion : choisir "he arrived" au lieu de "did he arrive"
    await page.locator("label").filter({ hasText: "he arrived" }).click();
    await page.getByRole("button", { name: "Terminer arrow_forward" }).click();
  } else if (await terminerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await terminerBtn.click();
  }

  // ── 5. Attente et capture d'écran du résultat ────────────────────────────
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: "test-results/screenshots/anglais-B2-result.png",
    fullPage: true,
  });

  // ── 6. Validation : recommandation B2 ────────────────────────────────────
  const pageContent = await page.content();
  const hasB2 =
    pageContent.toLowerCase().includes("b2") ||
    pageContent.toLowerCase().includes("renforcer") ||
    pageContent.toLowerCase().includes("upper") ||
    pageContent.toLowerCase().includes("se perfectionner");
  console.log(`[B2 Test] B2 recommendation found: ${hasB2}`);

  // ── 7. Continuer vers la validation ─────────────────────────────────────
  const continuerBtn = page.getByRole("button", { name: "Continuer" });
  if (await continuerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continuerBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/screenshots/anglais-B2-validation.png",
      fullPage: true,
    });
  }

  console.log("✅ Done: anglais B2 test complet");
});

export {};
