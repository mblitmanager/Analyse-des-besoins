import { test, expect } from "@playwright/test";

test("Test Français Voltaire", async ({ page }) => {

  // --- Accéder à l'application ---
  await page.goto("https://nsconseil.mbl-service.com/");

  // --- Profil utilisateur ---
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Français");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Voltaire");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 61");

  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // --- Parcours profil ---
  await page.getByRole("textbox", { name: "Ex: Assistant administratif," }).fill("aa");

  await page.locator(".formation-card__radio").first().click();

  await page
    .locator("div:nth-child(3) > .flex.items-center.w-full > .formation-card__radio")
    .click();

  await page.getByText("Occasionnellement").first().click();

  await page.locator("label").filter({ hasText: "Oui avec quelques difficultés" }).first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.locator("span").filter({ hasText: /^Oui avec quelques difficultés$/ }).click();

  await page.getByText("Occasionnellement").nth(1).click();
  await page.getByText("Non").nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();

  await page.getByRole("button", { name: "Valider mon profil" }).click();

  await page.getByRole("button", { name: "Français" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();

  await page.waitForTimeout(1000);

  // -------------------------
  // NIVEAU DÉCOUVERTE
  // -------------------------

  await expect(page.getByText("Elle est très efficace")).toBeVisible();
  await page.getByText("Un adverbe").first().click();

  await expect(page.getByText("dossiers urgents")).toBeVisible();
  await page.getByText("Un adjectif").click();

  await expect(page.getByText("Ces collaborateurs arrivent")).toBeVisible();
  await page.getByText("Un déterminant").click();

  await expect(page.getByText("quel est le COD")).toBeVisible();
  await page.getByText("les documents").click();

  await expect(page.getByText("quel est le COI")).toBeVisible();
  await page.getByText("à ses collègues").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // -------------------------
  // NIVEAU TECHNIQUE
  // -------------------------

  await expect(page.getByText("Il ne faut pas sans faire")).toBeVisible();
  await page.getByText("Incorrecte").first().click();

  await expect(page.getByText("Il serait préférable dans commander")).toBeVisible();
  await page.getByText("Incorrecte").nth(1).click();

  await expect(page.getByText("plus tôt ennuyeux")).toBeVisible();
  await page.getByText("Incorrecte").nth(2).click();

  await expect(page.getByText("davantage de temps")).toBeVisible();
  await page.getByText("Correcte").click();

  await expect(page.getByText("La réunion est prêt")).toBeVisible();
  await page.getByText("Incorrecte").nth(3).click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // -------------------------
  // NIVEAU PROFESSIONNEL
  // -------------------------

  await expect(page.getByText("Les voisins du dessus ont déménagés")).toBeVisible();
  await page.getByText("Incorrecte").nth(4).click();

  await expect(page.getByText("La plupart des coiffeurs utilise")).toBeVisible();
  await page.getByText("Incorrecte").nth(5).click();

  await expect(page.getByText("Est-ce bien toi qui va")).toBeVisible();
  await page.getByText("Incorrecte").nth(6).click();

  await expect(page.getByText("Cette jeune entreprise a fait appel")).toBeVisible();
  await page.getByText("Correcte").nth(1).click();

  await expect(page.getByText("chiffre d affaire")).toBeVisible();
  await page.getByText("Incorrecte").nth(7).click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // -------------------------
  // NIVEAU AFFAIRES
  // -------------------------

  await expect(page.getByText("tirer partie des faux pas")).toBeVisible();
  await page.getByText("Incorrecte").nth(8).click();

  await expect(page.getByText("quelque soit")).toBeVisible();
  await page.getByText("Incorrecte").nth(9).click();

  await expect(page.getByText("vus abattre")).toBeVisible();
  await page.getByText("Incorrecte").nth(10).click();

  await expect(page.getByText("Nous vous serions gré")).toBeVisible();
  await page.getByText("Incorrecte").nth(11).click();

  await expect(page.getByText("Après que les lumières")).toBeVisible();
  await page.getByText("Incorrecte").nth(12).click();

  // --- Terminer le quiz ---
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();

  await page.waitForTimeout(2500);
  await page.screenshot({ path: "Francais-Voltaire.png", fullPage: true });

  await page.getByRole("button", { name: "Continuer avec français arrow_forward" }).click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Francais-Voltaire-final.png", fullPage: true });

});