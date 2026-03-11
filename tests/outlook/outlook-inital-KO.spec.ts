import { test, expect } from "@playwright/test";

test("Test de positionnement Outlook", async ({ page }) => {
  // --- Accéder à l'application ---
  await page.goto("https://nsconseil.mbl-service.com/");

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
  await page.getByText("à créer des tableaux").click();

  await expect(page.getByText("Quels modules principaux sont inclus dans Outlook ?")).toBeVisible();
  await page.getByText("Word, Excel et PowerPoint").click();

  await expect(page.getByText("Quel élément permet d’afficher la liste des emails reçus ?")).toBeVisible();
  await page.getByText("Le dossier Courrier").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // // --- Niveau BASIQUE ---
  // await expect(page.getByText("Quelle action permet de créer un nouvel email ?")).toBeVisible();
  // await page.getByText("Nouveau message").click();

  // await expect(page.getByText("Quelle fonctionnalité utiliser pour vérifier les fautes dans un mail?")).toBeVisible();
  // await page.getByText("Vérification orthographique").click();

  // await expect(page.getByText("Comment répondre à une invitation à une réunion ?")).toBeVisible();
  // await page.getByText("En cliquant sur Accepter / Refuser").click();

  // await expect(page.getByText("Comment ajouter un nouveau contact ?")).toBeVisible();
  // await page.getByText("Depuis le dossier Contacts → Nouveau contact").click();

  // await expect(page.getByText("Quel onglet permet principalement de mettre en forme un email ?")).toBeVisible();
  // await page.getByText("Format du texte").click();

  // await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // // --- Niveau OPERATIONNEL ---
  // await expect(page.getByText("Comment créer un dossier pour classer ses emails ?")).toBeVisible();
  // await page.getByText("Clic droit sur Boîte de réception → Nouveau dossier").click();

  // await expect(page.getByText("Quelle fonction permet d’envoyer une réponse automatique pendant ses congés ?")).toBeVisible();
  // await page.getByText("Gestionnaire d’absence").click();

  // await expect(page.getByText("À quoi sert le champ CCI ?")).toBeVisible();
  // await page.getByText("Envoyer une copie en préservant la confidentialité des adresses").click();

  // await expect(page.getByText("Comment demander un accusé de réception ?")).toBeVisible();
  // await page.getByText("Dans les options du message").click();

  // await expect(page.getByText("Comment effectuer une recherche d’email par expéditeur ?")).toBeVisible();
  // await page.getByText("Utiliser la barre de recherche").click();

  // await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // // --- Niveau AVANCÉ ---
  // await expect(page.getByText("Quelle est la principale caractéristique d’un compte IMAP par rapport à un compte POP ?")).toBeVisible();
  // await page.getByText("Les mails restent synchronisés avec le serveur et accessibles depuis plusieurs appareils").click();

  // await expect(page.getByText("Comment programmer l’envoi d’un email à une date spécifique ?")).toBeVisible();
  // await page.getByText("Options → Différer la livraison").click();

  // await expect(page.getByText("À quoi servent les catégories de couleurs ?")).toBeVisible();
  // await page.getByText("Classer et filtrer les éléments Outlook").click();

  // await expect(page.getByText("Comment transférer automatiquement un mail d’un expéditeur spécifique vers un dossier prédéfini ?")).toBeVisible();
  // await page.getByText("Règles → Créer une règle").click();

  // await expect(page.getByText("Comment créer une liste de distribution ?")).toBeVisible();
  // await page.getByText("Depuis Contacts → Nouveau groupe").click();

  // await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // // --- Niveau EXPERT ---
  // await expect(page.getByText("Quelle est l’extension d’un modèle de courrier électronique Outlook ?")).toBeVisible();
  // await page.getByText(".msg").click();

  // await expect(page.getByText("Quelle est l’extension du fichier utilisé pour exporter un calendrier Outlook afin qu’il puisse être importé dans un autre agenda ?")).toBeVisible();
  // await page.getByText(".ics").click();

  // await expect(page.getByText("À quoi sert le mappage des champs lors de l’importation d’un fichier de contacts dans Outlook ?")).toBeVisible();
  // await page.getByText("Associer les colonnes du fichier importé aux champs correspondants dans Outlook").click();

  // await expect(page.getByText("Quelle fonctionnalité permet de configurer des flux RSS ?")).toBeVisible();
  // await page.getByText("Paramètres des flux RSS").click();

  // await expect(page.getByText("Quelle fonctionnalité permet de créer un dossier affichant automatiquement tous les messages non lus, sans les déplacer de leur emplacement d’origine ?")).toBeVisible();
  // await page.getByText("Un dossier de recherche").click();

  // --- Terminer le quiz ---
  await page.getByRole("button", { name: "Continuer quand même" }).click();
  // await page.getByRole("button", { name: "Continuer avec Outlook arrow_forward" }).click();

  // --- Screenshot final ---
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Outlook-Initial-KO.png", fullPage: true });
});