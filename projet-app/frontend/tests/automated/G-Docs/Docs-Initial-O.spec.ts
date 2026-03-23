import { test, expect } from '@playwright/test';

test('ICDL Google Docs', async ({ page }) => {

  await page.goto('http://localhost:5173/');

  // =====================
  // PROFIL
  // =====================

  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('ICDL');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('GoogleDocs');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06060606');

  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();

  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Google Docs');

  await page.locator('.formation-card__radio').first().click();

  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();

  await page.getByRole('button', { name: 'Valider mon profil' }).click();

  await page.getByRole('button', { name: 'cloud Google Docs' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();


  // =====================
  // MODULE Initial-O
  // =====================

  await expect(page.getByText("À quoi sert l’application Google Docs")).toBeVisible();

  await page.getByText("Créer des feuilles de calcul").click();
  await page.getByText("Fichier > Enregistrer").click();
  await page.getByText("Sur le disque dur de l’ordinateur").click();

  await page.getByRole("button", { name: "Suivant" }).click();





  // =====================
  // SCREEN ProfesionnelS
  // =====================

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "GoogleDocs-Initial-O1.png", fullPage: true });

  // await page
  //   .getByRole("button", { name: "Continuer avec Google Docs arrow_forward" })
  //   .click();
await page.getByRole("button", { name: "Continuer quand même" }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "GoogleDocs-Initial-O2.png", fullPage: true });

  await page.getByRole("button", { name: "Continuer" }).click();
await page.waitForTimeout(3000);
  await page.screenshot({ path: "GoogleDocs-Initial-O3.png", fullPage: true });

});