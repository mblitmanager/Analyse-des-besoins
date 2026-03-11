import { test, expect } from "@playwright/test";
// Excel - Initial & basique
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("sdfsd");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("f");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("fs");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("df");
  await page
    .locator("div")
    .filter({ hasText: /^Démarrer le parcoursarrow_forward$/ })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("sdf");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .locator(
      "div:nth-child(3) > .flex.items-center.w-full > .formation-card__radio",
    )
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .first()
    .click();
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
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "description Excel" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Une cellule").click();
  await page.getByText("=SOMME()").click();
  await page.getByText("Graphique Camembert (Secteur)").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").nth(3).click();
  await page.getByText("Je ne sais pas").nth(1).click();
  await page.getByText("Je ne sais pas").nth(2).click();
  await page.getByText("Je ne sais pas").nth(3).click();
  await page.locator("label").filter({ hasText: "AUJOURDHUI()" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(3000); // attente 3 secondes pour que la page se stabilise
  await page.screenshot({ path: "Excel-Initial-Basique.png", fullPage: true });
});
