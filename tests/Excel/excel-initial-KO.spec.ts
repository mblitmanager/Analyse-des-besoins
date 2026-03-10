import { test, expect } from "@playwright/test";
//excel initial + Digcomp
test("test", async ({ page }) => {
  await page.goto("https://nsconseil.mbl-service.com/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Excel");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("InitalKOa");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("z");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aza");
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page
    .locator("label")
    .filter({ hasText: "Oui avec quelques difficultés" })
    .nth(1)
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(1)
    .click();
  await page
    .locator("span")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.getByText("Non").nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "description Excel" }).click();
  await page.getByText("ContinuerContinuerarrow_forward").click();
  await page.getByText("Une cellule").click();
  await page.getByText("=SOMME()").click();
  await page.getByText("Graphique Camembert (Secteur)").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer quand même" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
});
