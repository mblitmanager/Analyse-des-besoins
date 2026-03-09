import { test, expect } from "@playwright/test";
//Prerequis KO - Question 1
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("a");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("a");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("aa");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .first()
    .click();
  await page.getByText("Jamais").first().click();
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
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page
    .getByRole("button", { name: "Accepter et voir mon bilan" })
    .click();
  await page.getByRole("button", { name: "Valider ce parcours et" }).click();
  await page
    .locator("div")
    .filter({ hasText: "quizQuel est l’objectif de" })
    .nth(5)
    .click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je vise un emploi pour lequel de nouvelles compétences me seront utiles",
    );
  await page.getByText("Non").first().click();
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Après-midi").click();
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
  await page.goto("http://localhost:5173/validation");
  await page.getByRole("button", { name: "Accueil home" }).click();
  await page.goto("http://localhost:5173/");
});
