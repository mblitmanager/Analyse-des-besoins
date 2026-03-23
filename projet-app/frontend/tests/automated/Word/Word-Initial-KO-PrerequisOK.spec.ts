import { test, expect } from "@playwright/test";
//word initial - Prérequis OK
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("a");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("a");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("a");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("assa");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "person_outlineDemandeur d’" })
    .click();
  await page.locator(".option-card__radio").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page
    .locator("div:nth-child(5) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .nth(1)
    .click();
  await page
    .locator("div:nth-child(6) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "description Word" }).click();
  await page.getByText("ContinuerContinuerarrow_forward").click();
  await page.getByText("A rédiger du contenu").click();
  await page.locator("label").filter({ hasText: "Fichier > Exporter" }).click();
  await page.locator("label").filter({ hasText: "Insertion > Images" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "Word-InitialKO.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer quand même" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  
  // await page.getByRole("button", { name: "Valider ce parcours et" }).click();
  // await page
  //   .getByRole("combobox")
  //   .selectOption(
  //     "Je vise un emploi pour lequel de nouvelles compétences me seront utiles",
  //   );
  // await page.locator("label").first().click();
  // await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  // await page.getByText("wb_twilightAprès-midi").click();
  // await page
  //   .getByRole("button", { name: "Valider mes disponibilités" })
  //   .click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "Word-initialKO2.png", fullPage: true });
});
