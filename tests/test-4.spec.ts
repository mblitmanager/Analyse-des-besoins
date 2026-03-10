import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("C1");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("TOEIC");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("0");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Anglais C1");
  await page.getByText("Reconversion").click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .first()
    .click();
  await page
    .locator("div:nth-child(2) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByText("Oui").nth(2).click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .nth(1)
    .click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page
    .locator("div:nth-child(5) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: /^Quotidiennement$/ })
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByText("ContinuerContinuerarrow_forward").click();
  await page.getByText("Lycée").click();
  await page.getByText("Non").first().click();
  await page.locator("label").filter({ hasText: "Non" }).nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("is").nth(2).click(); //impossible de selectionner is
  await page.getByText("have").first().click();
  await page.getByText("is", { exact: true }).nth(1).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.getByText("is watching").click();
  await page.getByText("goes").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
});
