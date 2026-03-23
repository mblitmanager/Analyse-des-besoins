import { test, expect } from '@playwright/test';

test('DigComp-Initial', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('DigComp');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Initial ');
  await page.getByRole('textbox', { name: 'Téléphone' }).click();
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('DigComp');
  await page.locator('.formation-card__radio').first().click();
  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: 'star Digitales Compétences' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // =====================
  // MODULE INITIAL
  // =====================

  await expect(page.getByText("Je reçois un email avec une pièce jointe que je veux mettre sur mon ordinateur")).toBeVisible();
  await page.getByText("Je l’ouvre et je copie le texte").click();

  await page.getByText("Je peux me connecter sans m’identifier").click();

  await page.getByText("Windows").click();

  await page.getByRole("button", { name: "Suivant" }).click();
// --- Screenshot résultat ---
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DigComp-initial-O.png", fullPage: true });
// await page.getByRole("button", { name: "Continuer quand même" }).click();




  
// await page
//     .getByRole("button", { name: "Continuer avec Digitales Compétences arrow_forward" })
//     .click();


  

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "DigComp-initial-O2.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DigComp-initial-O3.png", fullPage: true });
});