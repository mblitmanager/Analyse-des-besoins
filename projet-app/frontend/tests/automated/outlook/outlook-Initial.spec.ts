import { test, expect } from "@playwright/test";

test("Test Outlook INitial", async ({ page }) => {
  // --- Accéder à l'application ---
  await page.goto("http://localhost:5173");

  // --- Remplir le profil utilisateur ---
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Outlook");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Avancé");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 60");

  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // --- Choisir formation Outlook ---
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

  await page.getByRole("button", { name: "Outlook" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.waitForTimeout(3000);
  // --- Niveau INITIAL ---
  await expect(page.getByText("A quoi sert Microsoft Outlook")).toBeVisible();
  await page.getByText("à envoyer des e-mails").click();

  await expect(
    page.getByText("Quels modules principaux sont inclus dans Outlook ?"),
  ).toBeVisible();
  await page.getByText("Courrier, Calendrier et Contacts").click();

  await expect(
    page.getByText(
      "Quel élément permet d’afficher la liste des emails reçus ?",
    ),
  ).toBeVisible();
  await page.getByText("Le dossier Courrier").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // --- Niveau BASIQUE ---
  await expect(
    page.getByText("Quelle action permet de créer un nouvel email ?"),
  ).toBeVisible();
  await page.getByText("Nouveau message").click();

  await expect(
    page.getByText(
      "Quelle fonctionnalité utiliser pour vérifier les fautes dans un mail?",
    ),
  ).toBeVisible();
  await page.getByText("Règles").click();

  await expect(
    page.getByText("Comment répondre à une invitation à une réunion ?"),
  ).toBeVisible();
  await page.getByText("En créant un nouveau mail").click();

  await expect(
    page.getByText("Comment ajouter un nouveau contact ?"),
  ).toBeVisible();
  await page.getByText("Depuis le dossier Contacts → Nouveau contact").click();

  await expect(
    page.getByText(
      "Quel onglet permet principalement de mettre en forme un email ?",
    ),
  ).toBeVisible();
  await page.getByText("Format du texte").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // await page.getByRole("button", { name: "Continuer avec Outlook arrow_forward" }).click();

  // --- Screenshot final ---
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Outlook-Initial.png", fullPage: true });
});
