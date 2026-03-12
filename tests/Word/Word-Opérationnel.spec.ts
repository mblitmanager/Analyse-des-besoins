import { test, expect } from "@playwright/test";

test("Word-Opérationnel", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  // =====================
  // PROFIL
  // =====================

  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Word");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Opérationnel");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06060606");

  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Word');
  await page.locator('.formation-card__radio').first().click();
  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();

  await page.getByRole("button", { name: "description Word" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();


  // =====================
  // INITIAL
  // =====================

  await expect(page.getByText("rédiger du contenu")).toBeVisible();
  await page.getByText("rédiger du contenu").click();

  await page.getByText("Enregistrer sous").click();

  await page.getByText("Insertion > Images").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();


  // =====================
  // BASIQUE
  // =====================

  await page.getByText("CTRL + S").click();
  await page.getByText("Styles de tableau").click();
  await page.getByText("Une tabulation").click();
  await page.getByText("Double clic dans la partie la plus haute").click();
  await page.getByText("Bleu").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();


  // =====================
  // OPERATIONNEL
  // =====================

  await page.getByText("Accueil > Styles").click();
  await page.getByText("Mise en page > Colonnes").click();
  await page.getByText(".DOTX").click();
  await page.getByText("Coller de manière spéciale").click();
  await page.getByText("Références > Tables des matières").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();


  // =====================
  // AVANCE
  // =====================

  await page.getByText("Créer une table des matières suffira").click();
  await page.getByText("La note de bas de page s’affiche en bas de la page concernée, tandis que la note de fin est regroupée à la fin du document ou d’une section").click();
  await page.getByText("À visualiser et corriger des modifications proposées par d’autres utilisateurs ou par soi-même").click();
  await page.getByText("Fichiers > Informations > Gérer le document").click();
  await page.getByText("Volet de navigation").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();


  // // =====================
  // // EXPERT
  // // =====================

  // await page.getByText("Le suivi des modifications").click();
  // await page.getByText("Vérifier et gérer précisément la mise en forme d’un texte").click();
  // await page.getByText("Restreindre la modification").click();
  // await page.getByText("SQL Serveur").click();
  // await page.getByText("Il faut activer le ruban Développeur depuis Fichier > Options > Personnaliser le ruban").click();


  // // =====================
  // // FIN
  // // =====================

  // await page.getByRole("button", { name: "Terminer arrow_forward" }).click();

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "Word-Opérationnel.png", fullPage: true });

  await page
    .getByRole("button", {
      name: "Continuer avec Word arrow_forward",
    })
    .click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Word-Opérationnel2.png", fullPage: true });
});