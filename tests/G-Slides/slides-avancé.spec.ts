import { test, expect } from '@playwright/test';

test('ICDL Google Slides - avancé', async ({ page }) => {

  await page.goto('http://localhost:5173/');

  // =====================
  // PROFIL
  // =====================

  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('ICDL');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('GoogleSlides');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06060606');

  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();

  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Google Slides');

  await page.locator('.formation-card__radio').first().click();

  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();

  await page.getByRole('button', { name: 'Valider mon profil' }).click();

  await page.getByRole('button', { name: 'cloud Google Slides' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).first().click();


  // =====================
  // MODULE INITIAL
  // =====================

  await expect(page.getByText("Dans Google Slides, comment sont enregistrées les modifications")).toBeVisible();

  await page.getByText("Elles sont enregistrées automatiquement").click();
  await page.getByText("Affichage > Grille").click();
  await page.getByText("Outils > Nouvelle diapositive").click();

  await page.getByRole("button", { name: "Suivant" }).click();


// =====================
// MODULE BASIQUE
// =====================

// Question 1
await page
  .locator('div:has-text("Quelle mise en page est la plus adaptée pour créer la diapositive d’ouverture")')
  .getByText("Diapositive de titre")
  .click();

// Question 2
await page
  .locator('div:has-text("Quelle mise en forme est la plus adaptée pour présenter des points clés courts")')
  .getByText("Liste à puces")
  .click();

// Question 3
await page
  .locator('div:has-text("J’ai inséré une forme et je souhaite la dupliquer")')
  .locator('label:has-text("CTRL + D")')
  .click();

// Question 4
await page
  .locator('div:has-text("Quelle raccourci clavier me permet d’insérer une nouvelle diapositive")')
  .getByText("CTRL + M")
  .click();

// Question 5
await page
  .locator('div:has-text("Quelle action permet de conserver à la fois le contenu et la mise en page")')
  .getByText("Dupliquer la diapositive")
  .click();

await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE OPERATIONNEL
  // =====================

  await page.getByText("Insérer une ligne").click();
  await page.getByText("Faire glisser une poignée de redimensionnement").click();
  await page.getByText("Modifier le thème").click();
  await page.getByText("Diagramme").click();
  await page.getByText("Insertion > Vidéo").click();

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE AVANCE
  // =====================

  await page.getByText("Transition").click();
  await page.getByText("Animation").click();
  await page.getByText("Masquer la diapositive").click();
  await page.getByText("Insertion > En-tête et pied de page").click();
  await page.getByText(".pdf").click();

  await page.getByRole("button", { name: "Terminer" }).click();


  // =====================
  // SCREEN RESULTATS
  // =====================

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "glsides/GoogleSlides-avancé1.png", fullPage: true });

  await page
    .getByRole("button", { name: "Continuer avec Google Slides arrow_forward" })
    .click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "glsides/GoogleSlides-avancé2.png", fullPage: true });

  await page.getByRole("button", { name: "Continuer" }).click();

  await page.screenshot({ path: "gslides/GoogleSlides-avancé3.png", fullPage: true });

});