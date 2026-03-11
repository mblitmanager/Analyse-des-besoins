import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("ICDL");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Sketchup");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06");
  await page.getByRole("textbox", { name: "Téléphone" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .fill("AF");
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .press("Tab");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("AF");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Quotidiennement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page
    .locator("div:nth-child(3) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("div:nth-child(4) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(4).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "square Sketchup" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").first().click();
  await page.locator("label").nth(2).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je me prépare à entrer dans une formation qualifiante ou à un concours d'entrée",
    );
  await page.getByText("Non").first().click();
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page.getByRole("textbox").click();
  await page.getByRole("textbox").fill("fdgdg");
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
  // await page.goto("http://localhost:5173/validation");
  await page.getByText("Récapitulatif de votre demande").click();
});
