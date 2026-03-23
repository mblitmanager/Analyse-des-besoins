import { test, expect } from '@playwright/test';

test('DigComp-avancé', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('DigComp');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Avancé');
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
  await page.getByText("Enregistrer sous").click();

  await page.getByText("Identité Numérique La Poste").click();

  await page.getByText("Teams").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE BASIQUE
  // =====================

  await page.getByText("consulte plusieurs sites").click();
  await page.getByText("transfère le mail").click();
  await page.getByText("logiciel Word").click();
  await page.getByText("redémarre l’ordinateur").click();
  await page.getByText("combinaison de chiffres").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE OPERATIONNEL
  // =====================

  await page.getByText("recherche avancée").click();
  await page.getByText("crée des dossiers").click();
  await page.getByText("transforme en PDF").click();
  await page.getByText("imprimante laser").click();
  await page.getByText("utilise un antivirus").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE AVANCE
  // =====================

  await page.getByText("vérifier cette information").click();
  await page.getByText("application sur mon téléphone").click();
  await page.getByText("tableau sur Excel").click();
  await page.getByText("partage la connexion").click();
  await page.getByText("scan de mes fichiers").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE EXPERT
  // =====================

  await page.getByText("outils de veille").click();
  await page.getByText("respect de règles établies").click();
  await page.getByText("Je ne sais pas").nth(2).click();
  await page.getByText("J’évite Internet pour ne pas se tromper").click();
  await page.getByText("Fatigue visuelle").click();

  await page.getByRole("button", { name: "Terminer" }).click();
  // --- Screenshot résultat ---
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DIGCOMP-avancé.png", fullPage: true });
await page
    .getByRole("button", { name: "Continuer avec Digitales Compétences arrow_forward" })
    .click();


  

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "DigComp-Avancé2.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.screenshot({ path: "DigComp-Avancé3.png", fullPage: true });

});