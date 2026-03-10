import { test, expect } from "@playwright/test";
//excel initial + Digcomp
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Excel");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");

  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("a");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Adlu");
  await page.locator(".formation-card__radio").first().click();
  await page
    .locator("label")
    .filter({ hasText: "person_outlineDemandeur d’" })
    .click();
  await page.getByText("Jamais").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page.getByText("Non").nth(1).click();
  await page.getByText("Occasionnellement").nth(1).click();
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
  await page.getByRole("button", { name: "Ignorer et continuer" }).click();
  await page.getByRole("button", { name: "description Excel" }).click();
  await page.getByText("ContinuerContinuerarrow_forward").click();
  await page.locator("label").filter({ hasText: "Une cellule" }).click();
  await page.getByText("=SOMME(A1 ; A3 ; A5 ; A7)").click();
  await page
    .locator("label")
    .filter({ hasText: "Secteur / Histogramme / Courbe" })
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").nth(3).click();
  await page.getByText("Je ne sais pas").nth(1).click();
  await page.getByText("Je ne sais pas").nth(2).click();
  await page.getByText("Je ne sais pas").nth(3).click();
  await page.getByText("Je ne sais pas").nth(4).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Valider ce parcours et" }).click();
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
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
});
