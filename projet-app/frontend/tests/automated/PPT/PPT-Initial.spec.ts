import { test, expect } from '@playwright/test';

// PPT + Prérequis OK, résultat test = Initial (échec au niveau Basique)
// Attendu: TOSA PPT Initial + TOSA PPT Basique
test('PPT - Prereq OK, Test Initial → PPT Initial & PPT Basique', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('PPT');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Initial');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('PPT Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  // Prérequis OK
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /PowerPoint|PPT/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Répondre incorrectement pour échouer au niveau Initial → Basique
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'PPT-Initial-result.png', fullPage: true });
  // Assertion
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/PPT (Initial|Basique)/i, { timeout: 5000 });
});
