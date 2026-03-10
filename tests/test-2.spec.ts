import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
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
    .fill("a");
  await page.getByText("Indépendant").click();
  await page.getByText("Occasionnellement").first().click();
  await page
    .getByText(
      "2Savez-vous allumer un ordinateur, utiliser le clavier et la souris ?OuiOui",
    )
    .click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByText("Quotidiennement").nth(1).click();
  await page.getByText("Oui").nth(4).click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByText("Continuerarrow_forward", { exact: true }).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(1).click();
  await page.locator("label").nth(5).click();
  await page
    .locator("label:nth-child(2) > .option-card__radio")
    .first()
    .click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "is" }).nth(2).click();
  await page.getByText("have").first().click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.locator("label").filter({ hasText: "is" }).nth(5).click();
  await page.locator("label").filter({ hasText: "is watching" }).click();
  await page.getByText("goes").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
});
