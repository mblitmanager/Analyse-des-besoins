import { test, expect } from "@playwright/test";

test("excel expert", async ({ page }) => {
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
  await page.getByText("Données", { exact: true }).click();
  await page.getByText("Je protège le classeur").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("Utiliser la fonction SOMMEPROD").click();
  await page
    .locator("label")
    .filter({ hasText: "Utiliser un graphique combiné" })
    .click();
  await page.getByText("À concaténer des valeurs").click();
  // await page.getByText("À tester les valeurs é").click();
  await page
    .getByText("À trouver la position d’une valeur dans une matrice")
    .click();
  await page
    .getByText(
      "À regrouper et résumer des données provenant de plusieurs feuilles ou classeurs en un seul tableau",
    )
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  //ajout

  // --- Question 1 ---
  await expect(page.getByText("RECHERCHEV")).toBeVisible();
  await page.getByText("RECHERCHEV").click();

  // --- Question 2 ---
  await expect(
    page.getByText(
      "À créer un nouveau champ basé sur une formule appliquée aux champs existants",
    ),
  ).toBeVisible();
  await page
    .getByText(
      "À créer un nouveau champ basé sur une formule appliquée aux champs existants",
    )
    .click();

  // --- Question 3 ---
  await expect(page.getByText("L’outil solveur")).toBeVisible();
  await page.getByText("L’outil solveur").click();

  // --- Question 4 ---
  await expect(page.getByText("Développeur")).toBeVisible();
  await page.getByText("Développeur").click();

  // --- Question 5 ---
  await expect(
    page.getByText(
      "J’utilise une mise en forme conditionnelle avec formule et j’intègre la fonction DATEDIF",
    ),
  ).toBeVisible();
  await page
    .getByText(
      "J’utilise une mise en forme conditionnelle avec formule et j’intègre la fonction DATEDIF",
    )
    .click();

  // --- Valider le quiz ---
  // await expect(page.getByRole("button", { name: "Suivant arrow_forward" })).toBeVisible();
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "Excel-Expert2.png", fullPage: true });
  await page
    .getByRole("button", { name: "Continuer avec excel arrow_forward" })
    .click();

  // --- Screenshot final ---
  await page.waitForTimeout(3000); // attente 3 secondes pour que la page se stabilise
  await page.screenshot({ path: "Excel-Expert.png", fullPage: true });

  // await page.screenshot({ path: 'test-Excel-Avancé.png', fullPage: true });
});
