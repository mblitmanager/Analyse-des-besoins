import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nom", exact: true })
    .fill("Prerequis KO");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Q2");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("0");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Q2 - KO");
  await page
    .locator("div")
    .filter({ hasText: /^person_outlineSalarié$/ })
    .first()
    .click();
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Non").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
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
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page
    .getByRole("button", { name: "Accepter et voir mon bilan" })
    .click();
  await page.getByRole("button", { name: "Valider ce parcours et" }).click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je souhaite acquérir des savoirs de base et des compétences clés",
    );
  await page.getByText("Non").first().click();
  await page.getByText("Non").nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
  await page.getByRole("button", { name: "Accueil home" }).click();
});
