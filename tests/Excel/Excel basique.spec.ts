import { test, expect } from "@playwright/test";
//Excel - Opérationnel - avancé
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
    .fill("aa");
  await page.locator(".formation-card__radio").first().click();
  await page
    .locator(
      "div:nth-child(3) > .flex.items-center.w-full > .formation-card__radio",
    )
    .click();
  await page.getByText("Occasionnellement").first().click();
  await page
    .locator("label")
    .filter({ hasText: "Oui avec quelques difficultés" })
    .first()
    .click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page
    .locator("span")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page.getByText("Non").nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "description Excel" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Une cellule").click();
  await page.getByText("=SOMME()").click();
  await page.getByText("Graphique Camembert (Secteur)").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "L'icône : $" }).click();
  await page
    .locator("label")
    .filter({ hasText: "A ordonner les valeurs en" })
    .click();
  await page.getByText("SI()").click();
  await page.locator("label").filter({ hasText: "Figer les volets" }).click();
  await page.locator("label").filter({ hasText: "AUJOURDHUI()" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("À mettre en évidence les").click();
  await page
    .locator("label")
    .filter({ hasText: "De copier et/ou incrémenter" })
    .click();
  await page.getByText("Un tableau croisé dynamique").click();
  await page.getByText("Insertion", { exact: true }).click();
  await page.getByText("Je protège le classeur").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  // await page.getByText("Utiliser la fonction SOMMEPROD").click();
  // await page
  //   .locator("label")
  //   .filter({ hasText: "Utiliser un graphique combiné" })
  //   .click();
  // await page.getByText("À concaténer des valeurs").click();
  // await page.getByText("À tester les valeurs é").click();
  // await page.getByText("modèle de données").click();
  // await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-Excel-Basique.png", fullPage: true });
});
