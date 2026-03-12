import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("https://nsconseil.mbl-service.com");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("A1 KO");
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
  await page
    .locator("label")
    .filter({ hasText: /^watching$/ })
    .click();
  await page.locator("label").filter({ hasText: "goes" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // Dernière action
  // --- Capture d’écran avant de fermer ---
  // await page.getByRole("button", { name: "Continuer" }).click();
  // --- Attente que la page finale soit complètement chargée ---
  // await page.waitForLoadState("networkidle"); // attend que toutes les requêtes réseau soient terminées
  // await expect(page.getByRole("main")).toBeVisible();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "TOEIC-A1-KO.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page
    .locator("div")
    .filter({ hasText: "quizQuel est l’objectif de" })
    .nth(5)
    .click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je me prépare à entrer dans une formation qualifiante ou à un concours d'entrée",
    );
  await page.locator("label").first().click();
  await page.getByText("Non").nth(1).click();
  await page
    .locator("div")
    .filter({ hasText: /^Continuerarrow_forward$/ })
    .click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "TOEIC-A1-KO-2.png", fullPage: true });
});
