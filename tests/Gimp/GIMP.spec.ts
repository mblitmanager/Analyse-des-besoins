import { test, expect } from "@playwright/test";
//Gimp
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.locator("div").filter({ hasText: /^Nom$/ }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Test");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Gimp");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 60");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Assist");
  await page.locator(".formation-card__radio").first().click();
  await page
    .locator("label")
    .filter({ hasText: "person_outlineIndépendant" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .first()
    .click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page
    .locator("label")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "star Gimp" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "Régulièrement" }).click();
  await page
    .locator("div:nth-child(2) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
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
  await page.screenshot({ path: "test-gimp.png", fullPage: true });
  // await page.getByRole("button", { name: "Accueil home" }).click();
});
