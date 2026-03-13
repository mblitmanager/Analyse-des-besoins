import { test, expect } from "@playwright/test";
//Anglais B1 validé
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("A2");
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
  await page.getByText("was", { exact: true }).click();
  await page.getByText("were watching").click();
  await page.locator("label").filter({ hasText: "was watching" }).click();
  await page.getByText("much").click();
  await page.locator("label").filter({ hasText: "taller" }).click();
  await page.getByText("as beautiful as").click();
  await page.getByText("went").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  // --- Capture d’écran avant de fermer ---
  // await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "TOEIC-A1.png", fullPage: true });
  //continuer + screenshot
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "TOEIC-A1-2.png", fullPage: true });
});
