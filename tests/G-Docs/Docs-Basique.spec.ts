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
  // MODULE INITIAL
  // =====================

  await expect(page.getByText("À quoi sert l’application Google Docs")).toBeVisible();

  await page.getByText("Rédiger et mettre en forme des documents texte").click();
  await page.getByText("Elles sont enregistrées automatiquement").click();
  await page.getByText("Dans Google Drive en ligne").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE BASIQUE
  // =====================

  await page.getByText("Ajuster l’affichage du document à l’écran").click();
  await page.getByText("Ctrl + A").click();
  await page.getByText("Édition > Rechercher et remplacer").click();
  await page.getByText("Uniformiser l’alignement du texte entre les marges").click();
  await page.getByText("Outils > Nombre de mots").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE OPERATIONNEL
  // =====================

  await page.getByText("Changer la police manuellement").click();
  await page.getByText("J’augmente la taille du texte").click();
  await page.getByText("Des espaces").click();
  await page.getByText("Outils > Grammaire et orthographe").click();
  await page.getByText("Insérer un saut de section").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // // =====================
  // // MODULE AVANCE
  // // =====================

  // await page.getByText("Positionner dans l’en-tête").click();
  // await page.getByText("Fichier > Nouvelle page").click();
  // await page.getByText("Créer plusieurs documents personnalisés").click();
  // await page.getByText("Fichier > Configuration de la page").click();
  // await page.getByText("Mode Suggestion").click();

  // await page.getByRole("button", { name: "Terminer" }).click();


  // =====================
  // SCREEN ProfesionnelS
  // =====================

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "GoogleDocs-basique1.png", fullPage: true });

  // await page
  //   .getByRole("button", { name: "Continuer avec Google Docs arrow_forward" })
  //   .click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "GoogleDocs-basique2.png", fullPage: true });

  await page.getByRole("button", { name: "Continuer" }).click();

  await page.screenshot({ path: "GoogleDocs-basique3.png", fullPage: true });

});