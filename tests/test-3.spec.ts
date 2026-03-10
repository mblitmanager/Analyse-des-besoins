import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("A1");
  await page
    .getByText(
      "CivilitéMonsieurMadameNomPrénomTéléphonecallConseiller commercial (facultatif)",
    )
    .click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("A1");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("A1");
  await page
    .locator(
      "div:nth-child(4) > .flex.items-center.w-full > .formation-card__radio",
    )
    .click();
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page
    .locator("label")
    .filter({ hasText: "Oui avec quelques difficultés" })
    .nth(1)
    .click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page
    .locator("span")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.getByText("Non").nth(3).click();
  await page.getByText("Jamais").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "Lycée" }).click();
  await page.locator("label").nth(5).click();
  await page.getByText("Non").nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("is").nth(2).click();
  //imposible de selectionner is
  await page.getByText("have").first().click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.locator("label").filter({ hasText: "is watching" }).click();
  await page.locator("label").filter({ hasText: "goes" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
});
