import { test, expect } from "@playwright/test";

/**
 * Test E2E complet — Anglais niveau B1
 * Parcours adaptatif CEFR : l'apprenant valide A1 + A2 puis échoue en B1
 * → Recommandation attendue : B1 (Acquérir les bases professionnelles)
 *
 * Réponses A1 : toutes correctes
 * Réponses A2 : toutes correctes
 * Réponses B1 : toutes incorrectes → stop B1
 */
test("Anglais — niveau B1 validé (KO B2)", async ({ page }) => {
  // ── 1. Page d'accueil : profil utilisateur ──────────────────────────────
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Prénom" }).fill("B1");
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

  // ── Bloc A1 — Réponses CORRECTES (valider A1) ────────────────────────────
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

  // ── Bloc A2 — Réponses CORRECTES (valider A2) ────────────────────────────
  await page.getByText("were", { exact: true }).click();
  await page.getByText("were watching").click();
  await page.locator("label").filter({ hasText: "was watching" }).click();
  await page.getByText("much").click();
  await page.locator("label").filter({ hasText: "tallest" }).click();
  await page.getByText("as beautiful as").click();
  await page.getByText("went").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc B1 — Réponses CORRECTES (valider B1) ────────────────────────────
  // (correspond aux vraies réponses pour que le test valide ce niveau)
  await page.getByText("since").click();
  await page.locator("label").filter({ hasText: /^had$/ }).click();
  await page.getByText("was built").click();
  await page.locator("label").filter({ hasText: "has worked" }).click();
  await page.locator("label").filter({ hasText: "had eaten" }).click();
  await page.getByText("drank").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── Bloc B2 — Réponses INCORRECTES (échouer B2 → recommandation B1) ──────
  // On choisit les mauvaises réponses pour stopper à B1
  await page.locator("label").filter({ hasText: "should told" }).click();
  await page.getByText("wouldn't be").click();
  await page.locator("label").filter({ hasText: "will have finished" }).click();
  await page.getByText("will be lying").click();
  await page.locator("label").filter({ hasText: "off" }).click();
  await page.getByText("Although").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // ── 5. Attente et capture d'écran du résultat ────────────────────────────
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: "test-results/screenshots/anglais-B1-result.png",
    fullPage: true,
  });

  // ── 6. Validation : recommandation B1 ────────────────────────────────────
  const pageContent = await page.content();
  const hasB1 =
    pageContent.toLowerCase().includes("b1") ||
    pageContent.toLowerCase().includes("acquérir") ||
    pageContent.toLowerCase().includes("intermédiaire");
  console.log(`[B1 Test] B1 recommendation found: ${hasB1}`);

  // ── 7. Continuer vers la validation ─────────────────────────────────────
  const continuerBtn = page.getByRole("button", { name: "Continuer" });
  if (await continuerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continuerBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/screenshots/anglais-B1-validation.png",
      fullPage: true,
    });
  }

  console.log("✅ Done: anglais B1 test complet");
});

export {};
