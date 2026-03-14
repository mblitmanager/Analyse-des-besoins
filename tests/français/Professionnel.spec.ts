import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nom", exact: true })
    .fill("Voltaire");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Professionnel");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 06");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Occasionnellement").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .nth(1)
    .click();
  await page
    .locator("div:nth-child(5) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Français" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Non").click();
  await page.locator("label").filter({ hasText: "C1" }).click();
  await page.getByText("Un peu").first().click();
  await page.getByText("Un peu").nth(1).click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(1).click();
  await page.locator("label").filter({ hasText: "Régulièrement" }).click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page.getByText("Magazines").click();
  await page.getByText("Comptes-rendus").click();
  await page.getByText("Régulièrement").nth(3).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Un adverbe").first().click();
  await page.locator("label").filter({ hasText: "Un adjectif" }).nth(1).click();
  await page.getByText("Un déterminant").nth(1).click();
  await page.getByText("les documents").nth(1).click();
  await page
    .locator("label")
    .filter({ hasText: "à ses collègues" })
    .nth(1)
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").nth(1).click();
  await page.getByText("Incorrecte").nth(3).click();
  await page.getByText("Incorrecte").nth(5).click();
  await page
    .locator("label")
    .filter({ hasText: /^Correcte$/ })
    .nth(3)
    .click();
  await page.getByText("Correcte", { exact: true }).nth(4).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("Incorrecte").nth(1).click();
  await page.getByText("Incorrecte").nth(3).click();
  await page.getByText("Incorrecte").nth(5).click();
  await page.locator("label").filter({ hasText: "Incorrecte" }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: /^Correcte$/ })
    .nth(4)
    .click();
  await page.locator("label").filter({ hasText: "Incorrecte" }).nth(4).click();
  await page
    .locator("label")
    .filter({ hasText: /^Correcte$/ })
    .nth(3)
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").nth(1).click();
  await page.getByText("Incorrecte").nth(3).click();
  await page.locator("label").filter({ hasText: "Correcte" }).nth(2).click();
  await page.locator("label").filter({ hasText: "Correcte" }).nth(3).click();
  await page.getByText("Incorrecte", { exact: true }).nth(4).click();
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();
  await page.waitForTimeout(3000); 
  await page.screenshot({ path: "Voltaire-Professionnel2.png", fullPage: true });
   
  // await page
  //   .getByRole("button", { name: "Continuer avec Français arrow_forward" })
  //   .click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Voltaire-Professionnel.png", fullPage: true });
});
