import { test, expect } from "@playwright/test";
//anglais A1- KO
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("dfd");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("dfdf");
  await page.getByRole("textbox", { name: "Prénom" }).fill("d");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("d");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .getByRole("checkbox", { name: "person_outline Salarié check" })
    .press("s");
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("df");
  await page.locator("label").filter({ hasText: "Jamais" }).first().click();
  await page.getByText("Non").first().click();
  await page.getByText("Non").nth(1).click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page
    .locator("label")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "Ignorer et continuer" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "Collège" }).click();
  await page.getByText("Non").first().click();
  await page
    .locator("div:nth-child(3) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("div:nth-child(4) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByText("Ponctuel").click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("is").nth(2).click();
  await page.locator("label").nth(5).click();
  await page.getByText("is", { exact: true }).nth(1).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.getByText("is watching").click();
  await page.getByText("is going").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
});
