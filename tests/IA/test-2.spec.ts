import { test, expect } from '@playwright/test';
//INkrea IAasync ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("ICDL");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Sketchup");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06");
  await page.getByRole("textbox", { name: "Téléphone" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .fill("AF");
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .press("Tab");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("AF");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Quotidiennement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page
    .locator("div:nth-child(3) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("div:nth-child(4) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(4).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole('button', { name: 'star Intelligence' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  await page.getByText('Secrétariat').click();
  await page.locator('label').filter({ hasText: 'Déjà testé' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  await page.getByRole('combobox').selectOption('Je me forme pour m\'améliorer sur mon poste actuel');
  await page.locator('label').first().click();
  await page.getByText('Non').nth(1).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  await page.getByText('wb_twilightAprès-midi').click();
  await page.getByRole('button', { name: 'Valider mes disponibilités' }).click();
  await page.goto('http://localhost:5173/validation');
});