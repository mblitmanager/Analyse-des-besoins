import { test, expect } from "@playwright/test";
//anglais B2 - OK
// Renforcer les compétences
// Niveau C1 - Se perfectionner

test("test", async ({ page }) => {
  // Recording...

  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("B2");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 06");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");
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
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "Lycée" }).click();
  await page.locator("label").nth(5).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator('label:has-text("is")').first().click(); //non séléctionné
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
  await page.getByText("since").click();
  await page.locator("label").filter({ hasText: /^had$/ }).click();
  await page.getByText("was built").click();
  await page.getByText("has worked").click();
  await page.getByText("had eaten").click();
  await page.getByText("drank").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("should have told").click();
  await page.getByText("wouldn’t have been").click();
  await page.getByText("will have finished").click();
  await page.getByText("will be lying").click();
  await page.getByText("out", { exact: true }).click();
  await page.getByText("Although").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("would rather").click();
  await page.getByText("keep", { exact: true }).click();
  await page.getByText("is submitted").click();
  await page.locator("label").filter({ hasText: "Because" }).click();
  await page.locator("label").filter({ hasText: "have I heard" }).click();
  await page.locator("label").filter({ hasText: "did he arrive" }).click();
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();
  // --- Capture d’écran avant de fermer ---
  // await page.getByRole("button", { name: "Continuer" }).click();
  // --- Attente que la page finale soit complètement chargée ---
  // await page.waitForLoadState("networkidle"); // attend que toutes les requêtes réseau soient terminées
  // await expect(page.getByRole("main")).toBeVisible();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "TOEIC-B2.png", fullPage: true });
});
