import { test, expect } from '@playwright/test';

test('DigComp INitial - OK', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('dd');
  await page.getByRole('textbox', { name: 'Prénom' }).click();
  await page.getByRole('textbox', { name: 'Prénom' }).fill('aa');
  await page.getByRole('textbox', { name: 'Téléphone' }).click();
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('az');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('ze');
  await page.locator('.formation-card__radio').first().click();
  await page.getByText('Reconversion').click();
  await page.getByText('Occasionnellement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.getByText('Occasionnellement').nth(1).click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(4).click();
  await page.locator('label').filter({ hasText: /^Oui$/ }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: 'star Digitales Compétences' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // =====================
  // MODULE INITIAL
  // =====================

  await expect(page.getByText("Je reçois un email avec une pièce jointe que je veux mettre sur mon ordinateur")).toBeVisible();
  await page.getByText("Enregistrer sous").click();

  await page.getByText("Identité Numérique La Poste").click();

  await page.getByText("Teams").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE BASIQUE
  // =====================

  await page.getByText("Je regarde un seul site").click();
  await page.getByText("Je copie tout le texte dans un nouveau mail").click();
  await page.getByText("J’utilise le logiciel Excel").click();
  await page.getByText("redémarre l’ordinateur").click();
  await page.getByText("combinaison de chiffres").click();

  await page.getByRole("button", { name: "Suivant" }).click();
  //screenshot résultat
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DigComp-initial-OK.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DigComp-initial-OK2.png", fullPage: true });
  
});