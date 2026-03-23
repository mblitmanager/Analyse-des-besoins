import { test, expect } from '@playwright/test';

test('ICDL Google Slides - avancé', async ({ page }) => {

  // =====================
  // FONCTION UTILITAIRE
  // =====================
  async function answer(question: string, response: string) {
    await page
      .locator(`div:has-text("${question}")`)
      .locator(`label:has-text("${response}")`)
      .click();
  }

  await page.goto('http://localhost:5173/');

  // =====================
  // PROFIL
  // =====================

  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('ICDL');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('GoogleSlides');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06060606');

  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();

  await page
    .getByRole('textbox', { name: 'Ex: Assistant administratif,' })
    .fill('Google Slides');

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

  await expect(
    page.getByText("Dans Google Slides, comment sont enregistrées les modifications")
  ).toBeVisible();

  await answer(
    "Dans Google Slides, comment sont enregistrées les modifications",
    "Elles sont enregistrées automatiquement"
  );

  await answer(
    "Quel mode d’affichage permet de visualiser toutes les diapositives",
    "Affichage > Grille"
  );

  await answer(
    "Quelle action ne permet pas d’ajouter une nouvelle diapositive",
    "Outils > Nouvelle diapositive"
  );

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE BASIQUE
  // =====================

  await answer(
    "Quelle mise en page est la plus adaptée pour créer la diapositive d’ouverture",
    "Diapositive de titre"
  );

  await answer(
    "Quelle mise en forme est la plus adaptée pour présenter des points clés courts",
    "Liste à puces"
  );

  await answer(
    "J’ai inséré une forme et je souhaite la dupliquer",
    "CTRL + D"
  );

  await answer(
    "Quelle raccourci clavier me permet d’insérer une nouvelle diapositive",
    "CTRL + M"
  );

  await answer(
    "Quelle action permet de conserver à la fois le contenu et la mise en page",
    "Dupliquer la diapositive"
  );

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE OPERATIONNEL
  // =====================

  await answer(
    "Après avoir inséré un tableau, comment ajouter une nouvelle ligne",
    "Insérer une ligne"
  );

  await answer(
    "Comment redimensionner une image insérée",
    "Faire glisser une poignée de redimensionnement"
  );

  await answer(
    "Quelle fonctionnalité permet de maintenir un format cohérent",
    "Modifier le thème"
  );

  await answer(
    "Vous souhaitez représenter les différentes étapes d’un projet",
    "Diagramme"
  );

  await answer(
    "Vous souhaitez intégrer une vidéo YouTube",
    "Insertion > Vidéo"
  );

  await page.getByRole("button", { name: "Suivant" }).click();


  // =====================
  // MODULE AVANCE
  // =====================

  await answer(
    "Quelle fonctionnalité permet d’appliquer un effet lors du passage",
    "Transition"
  );

  await answer(
    "Quelle fonctionnalité permet d’appliquer un effet d’apparition",
    "Animation"
  );

  await answer(
    "Quelle action permet d’exclure temporairement une diapositive",
    "Masquer la diapositive"
  );

  await answer(
    "Quelle fonctionnalité permet d’ajouter automatiquement le numéro",
    "Insertion > En-tête et pied de page"
  );

  await answer(
    "Quel format permet de partager une présentation",
    ".pdf"
  );

  await page.getByRole("button", { name: "Terminer" }).click();


  // =====================
  // SCREEN RESULTATS
  // =====================

  await page.waitForTimeout(2000);

  await page.screenshot({
    path: "gslides/GoogleSlides-avance1.png",
    fullPage: true
  });

  await page
    .getByRole("button", {
      name: "Continuer avec Google Slides arrow_forward"
    })
    .click();

  await page.waitForTimeout(3000);

  await page.screenshot({
    path: "gslides/GoogleSlides-avance2.png",
    fullPage: true
  });

  await page.getByRole("button", { name: "Continuer" }).click();

  await page.screenshot({
    path: "gslides/GoogleSlides-avance3.png",
    fullPage: true
  });

});