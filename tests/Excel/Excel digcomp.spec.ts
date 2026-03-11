import { test, expect } from "@playwright/test";
//excel initial + Digcomp
test("test", async ({ page }) => {
  await page.goto("https://nsconseil.mbl-service.com");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Excel");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("Inital");
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
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Une cellule").click();
  await page.getByText("=SOMME()").click();
  await page.getByText("Graphique Camembert (Secteur)").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "L'icône : £" }).click();
  await page.locator("label").filter({ hasText: "A ordonner les valeurs en fonction du filtre" }).click();
  await page.locator("label").filter({ hasText: "SOMME()" }).click();
  await page.locator("label").filter({ hasText: "Mise en forme conditionnelle" }).click();
  await page.locator("label").filter({ hasText: "AUJOURDHUI()" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(3000); // attente 3 secondes pour que la page se stabilise
  await page.screenshot({ path: 'test-Excel-Digcomp-KO.png', fullPage: true });
});
