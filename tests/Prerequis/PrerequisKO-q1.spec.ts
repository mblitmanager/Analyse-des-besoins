import { test, expect } from "@playwright/test";

// Prérequis KO - Question 1
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  // Formulaire
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("a");
  await page.getByRole("textbox", { name: "Prénom" }).fill("a");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("aa");

  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // Métier
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");

  // Statut
  await page.locator("label", { hasText: "Salarié" }).click();

  // Questions profil
  await page.locator("label", { hasText: "Quotidiennement" }).first().click();
  await page.locator("label", { hasText: "Jamais" }).first().click();
  await page.locator("label", { hasText: "Non" }).first().click();

  await page
    .locator("label", { hasText: "Oui avec quelques difficultés" })
    .nth(1)
    .click();
  await page.locator("label", { hasText: "Occasionnellement" }).nth(1).click();
  await page
    .locator("label", { hasText: "Oui avec quelques difficultés" })
    .last()
    .click();

  // Ici ton problème "Non" non pris en compte
  await page.locator("label", { hasText: /^Non$/ }).last().click();

  await page.locator("label", { hasText: "Occasionnellement" }).nth(2).click();

  // Gestion dialog
  page.once("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });

  await page.getByRole("button", { name: "Valider mon profil" }).click();

  // Bilan
  await page
    .getByRole("button", { name: "Accepter et voir mon bilan" })
    .click();
  await page.getByRole("button", { name: /Valider ce parcours/ }).click();

  // // Quiz
  // await page.locator("div", { hasText: "Quel est l’objectif" }).click();

  // await page.getByRole("combobox").selectOption(
  //   "Je vise un emploi pour lequel de nouvelles compétences me seront utiles"
  // );

  // await page.locator("label", { hasText: /^Non$/ }).first().click();
  // await page.locator("label").nth(2).click();

  // await page.getByRole("button", { name: /Continuer/ }).click();

  // // Disponibilités
  // await page.getByText("Après-midi").click();
  // await page.getByRole("button", { name: "Valider mes disponibilités" }).click();

  // // Validation finale
  // await page.goto("http://localhost:5173/validation");
});
