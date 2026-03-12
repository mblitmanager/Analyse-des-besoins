import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByText("Madame").click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("IA");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Inkrea");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 00 00 00 00");
  await page.getByRole("textbox", { name: "Conseiller commercial (" }).click();
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .fill("AF");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("IA");
  await page.getByText("person_outlineReconversion").click();
  await page.locator(".option-card__radio").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page
    .locator("div:nth-child(3) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("div:nth-child(4) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(4).click();
  await page
    .locator("div:nth-child(6) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "star Intelligence" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  // await page.locator(".option-card__radio").first().click();
  // await page.locator("label").filter({ hasText: "Jamais utilisé" }).click();
  // await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  // await page
  //   .locator("div")
  //   .filter({ hasText: "quizQuel est l’objectif de" })
  //   .nth(5)
  //   .click();
  // await page
  //   .getByRole("combobox")
  //   .selectOption(
  //     "Je vise un emploi pour lequel de nouvelles compétences me seront utiles",
  //   );
  // await page.locator("label").first().click();
  // await page
  //   .locator(
  //     "div:nth-child(3) > .space-y-3 > .grid > label > .option-card__radio",
  //   )
  //   .first()
  //   .click();
  // await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  // await page.getByText("Après-midi").click();
  // await page
  //   .getByRole("button", { name: "Valider mes disponibilités" })
    // .click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "IA-Inkrea.png", fullPage: true });
  // await page.getByRole('button', { name: 'Accueil home' }).click();
});
