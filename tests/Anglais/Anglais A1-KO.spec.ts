import { test, expect } from "@playwright/test";

// anglais A1 - KO
test("test", async ({ page }) => {
  test.setTimeout(120000); // Timeout augmenté

  await page.goto("http://localhost:5173/");
  await page.waitForLoadState("networkidle");

  // Formulaire
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("dfdf");
  await page.getByRole("textbox", { name: "Prénom" }).fill("d");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("d");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();

  // Statut
  await page.locator("label", { hasText: "Salarié" }).click();

  // Métier
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("df");

  // Questions profil
  await page.locator("label", { hasText: "Jamais" }).first().click();
  await page.locator("label", { hasText: /^Non$/ }).first().click();
  await page.locator("label", { hasText: "Occasionnellement" }).nth(1).click();
  await page.locator("label", { hasText: "Oui avec quelques difficultés" }).first().click();
  await page.locator("label", { hasText: /^Non$/ }).nth(3).click();
  await page.locator("label", { hasText: "Occasionnellement" }).nth(2).click();

  // Valider profil
  await page.getByRole("button", { name: "Valider mon profil" }).click();

  // Ignorer bilan
  const skipBtn = page.getByRole("button", { name: "Ignorer et continuer" });
  await expect(skipBtn).toBeVisible();
  await expect(skipBtn).toBeEnabled();
  await skipBtn.click();

  // Choix formation
  await page.getByRole("button", { name: /Anglais/ }).click();

  // Continuer
  const continuerBtn = page.getByRole("button", { name: /Continuer/ });
  await expect(continuerBtn).toBeVisible();
  await expect(continuerBtn).toBeEnabled();
  await continuerBtn.click();

  // Niveau
  await page.locator("label", { hasText: "Collège" }).click();
  await page.locator("label", { hasText: /^Non$/ }).first().click();

  // Options → éviter div:nth-child
  await page.locator(".option-card__radio").first().click();
  await page.locator(".option-card__radio").nth(1).click();

  // Ponctuel
  await page.locator("label", { hasText: "Ponctuel" }).click();

  await page.getByRole("button", { name: /Continuer/ }).click();

  // Quiz
  await page.locator("button", { hasText: "is", exact: true }).nth(2).click();
  await page.locator("label").nth(5).click();
  await page.locator("button", { hasText: "is", exact: true }).nth(1).click();
  await page.locator("button", { hasText: "is", exact: true }).nth(2).click();
  await page.locator("button", { hasText: "is watching" }).click();
  await page.locator("button", { hasText: "is going" }).click();

  await page.getByRole("button", { name: /Suivant/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
});