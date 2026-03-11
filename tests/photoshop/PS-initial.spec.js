import { test, expect } from "@playwright/test";

test("Test Photoshop", async ({ page }) => {

  // --- Accéder à l'application ---
  await page.goto("http://localhost:5173/");

  // --- Profil utilisateur ---
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Photoshop");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Test");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 62");

  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // --- Profil parcours ---
  await page.getByRole("textbox", { name: "Ex: Assistant administratif," }).fill("graphiste");

  await page.locator(".formation-card__radio").first().click();

  await page
    .locator("div:nth-child(3) > .flex.items-center.w-full > .formation-card__radio")
    .click();

  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByText("Oui avec quelques difficultés").nth(2).click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page.getByText("Non").nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();

  await page.getByRole("button", { name: "Valider mon profil" }).click();

  await page.getByRole("button", { name: "Photoshop" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();

  await page.waitForTimeout(1000);
await page.locator('.option-card__radio').first().click();
await expect(page.getByText("Avez-vous déjà retouché des photos")).toBeVisible();
await page.getByText("Oui").click();
await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // -------------------------
  // NIVEAU INITIAL
  // -------------------------

  await expect(page.getByText("Comment ouvrir une image")).toBeVisible();
  await page.getByText("Fichier > Ouvrir").click();

  await expect(page.getByText("différence principale entre le format PSD")).toBeVisible();
  await page.getByText("Le PSD est l’extension de Photoshop").click();

  await expect(page.getByText("fonction de l’outil Recadrage")).toBeVisible();
  await page.getByText("Supprimer une partie de l’image").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  // -------------------------
  // NIVEAU initial
  // -------------------------

  await expect(page.getByText("fonction de l’outil Pipette")).toBeVisible();
  await page.getByText("Dessiner une forme").click();

  await expect(page.getByText("raccourci pour annuler")).toBeVisible();
  await page.getByText("Ctrl + Z").click();

  await expect(page.getByText("différence principale entre le format PSD")).toBeVisible();
  await page.getByText("Le PSD est plus léger que le JPEG").click();

  await expect(page.getByText("À quoi sert un calque")).toBeVisible();
  await page.getByText("séparer les éléments").click();

  await expect(page.getByText("Ctrl + T permet")).toBeVisible();
  await page.getByText("transformer").click();

  await expect(page.getByText("Comment inverser une sélection")).toBeVisible();
  await page.getByText("Sélection > Intervertir").click();

  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();

  

  // await page.waitForTimeout(2500);
  // await page.screenshot({ path: "Photoshop-initial-OK.png", fullPage: true });

  // await page.getByRole("button", { name: "Continuer avec photoshop arrow_forward" }).click();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "Photoshop-initial.png", fullPage: true });

});