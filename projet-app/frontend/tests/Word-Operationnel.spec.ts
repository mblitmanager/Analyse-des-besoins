import { test, expect } from "@playwright/test";

test("Word Operationnel Flow", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  // Fill user info
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Test");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Word");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("0123456789");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // Prerequis
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Assistant");
  await page.locator(".formation-card__radio").first().click(); // Salarié

  // IT Skills (Prerequis questions)
  // Note: we need to handle radios/checks carefully as they might have changed
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();

  // Since labels are used, we click them
  await page.getByRole("button", { name: "Valider mon profil" }).click();

  // Formation Selection - more prominent UI now
  // We need to find "Word"
  await page.getByRole("button", { name: "Word", exact: false }).click();

  // Now we must click "Continuer" (it's in the sticky bar OR the inline banner)
  // Let's use getByRole button "Continuer"
  await page.getByRole("button", { name: "Continuer", exact: true }).click();

  // Positionnement - Niveau Initial -> Basique -> Opérationnel

  // Q1
  await page.getByText("A rédiger du contenu").click();
  await page.getByText("Fichier > Enregistrer sous").click();
  await page.getByText("Insertion > Images").click();
  await page.getByRole("button", { name: "Suivant", exact: false }).click();

  // Q2
  await page.getByText("CTRL + S").click();
  await page.getByText("Styles de tableau").click();
  await page.getByText("Une tabulation").click();
  await page.getByText("Insérer une image > Clic").click();
  await page.getByText("Bleu").click();
  await page.getByRole("button", { name: "Suivant", exact: false }).click();

  // Q3
  await page.getByText("Rechercher > Remplacer").click();
  await page.getByText("Accueil > Styles").click();
  await page.getByText("Mise en page > Colonnes").click();
  await page.getByText(".DOTX").click();
  await page.getByText("Copier le tableau dans Excel").click();
  await page.getByText("Ajouter un sommaire").click();
  await page.getByRole("button", { name: "Suivant", exact: false }).click();

  // Q4
  await page.getByText("sous-documents").click();
  await page.getByText("La note de bas de page s’").click();
  await page.getByText("modifications proposées").click();
  await page.getByText("Révision > Restreindre la").click();
  await page.getByText("Volet de navigation").click();

  // Validation
  await page.getByRole("button", { name: "Terminer", exact: false }).click();

  // Resultats
  await expect(page.getByText("Opérationnel")).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();

  // Final Validation
  await page.getByRole("button", { name: "Valider ce parcours" }).click();

  // Availabilities
  await page.getByRole("combobox").selectOption({ index: 1 });
  await page.getByText("Non").first().click();
  await page.locator("label").nth(2).click(); // some radio
  await page.getByRole("button", { name: "Continuer", exact: false }).click();
  await page.getByText("Après-midi").click();
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();

  // Final confirmation
  await expect(page.getByText("Bilan de votre analyse")).toBeVisible();
});
