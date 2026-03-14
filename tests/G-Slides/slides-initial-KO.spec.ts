import { test, expect } from '@playwright/test';

test('ICDL Google Sheets-initiaux-KO', async ({ page }) => {

  await page.goto('http://localhost:5173/');

  // =====================
  // PROFIL
  // =====================

  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('ICDL');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('GoogleSheets');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06060606');

  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();

  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Google Sheets');

  await page.locator('.formation-card__radio').first().click();

  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();

  await page.getByRole('button', { name: 'Valider mon profil' }).click();

  await page.getByRole('button', { name: 'cloud Google Sheets' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();


  // =====================
  // MODULE INITIAL
  // =====================

  await expect(page.getByText("Dans Google Sheets, comment appelle-t-on l’intersection")).toBeVisible();

  await page.getByText("Un champ").first().click();
  await page.getByText("Il n’y a rien à faire, l’enregistrement est automatique").click();
  await page.getByText("C4").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // // =====================
  // // MODULE BASIQUE
  // // =====================

  // await page.getByText("=A1+A5").click();
  // await page.getByText("À dupliquer une feuille").click();
  // await page.getByText("Maintenir Maj et cliquer sur la dernière").click();
  // await page.getByText("Données > Trier la plage").click();
  // await page.getByText("MAINTENANT()").click();

  // await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE OPERATIONNEL
  // =====================

  // await page.getByText("%").click();
  // await page.getByText("=SI(A1>=10;”Admis”;”Ajourné”)").click();
  // await page.getByText("Poignée de recopie").click();
  // await page.getByText("Courbe").click();
  // await page.getByText("Une division par zéro a été effectuée").click();

  // await page.getByRole("button", { name: "Suivant" }).click();


  // // =====================
  // // MODULE AVANCE
  // // =====================

  // await page.getByText("Masquer les lignes").click();
  // await page.getByText("NB.SI").click();
  // await page.getByText("Données > Trier").click();
  // await page.getByText("SOUS.TOTAL").click();
  // await page.getByText("RECHERCHEV").click();

  // await page.getByRole("button", { name: "Terminer" }).click();


  // =====================
  // SCREEN initiaux-KOS
  // =====================

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "GoogleSheets-initiaux-KO1.png", fullPage: true });
await page.getByRole("button", { name: "Continuer quand même" }).click();
  // await page
  //   .getByRole("button", { name: "Continuer avec Google Sheets arrow_forward" })
  //   .click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "GoogleSheets-initiaux-KO2.png", fullPage: true });

  await page.getByRole("button", { name: "Continuer" }).click();

  await page.screenshot({ path: "GoogleSheets-initiaux-KO3.png", fullPage: true });

});