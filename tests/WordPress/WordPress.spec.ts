import { test, expect } from '@playwright/test';

// WordPress - résultat test = Initial (stop à Basique)
// Attendu: TOSA Wordpress Initial + TOSA Wordpress basique
test('WordPress - Résultat Initial → WordPress Initial & WordPress basique', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Wordpress');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Initial');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('WordPress Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /WordPress|Wordpress/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Répondre incorrectement pour rester au niveau Initial
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'WordPress-Initial.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Wordpress (Initial|basique)/i, { timeout: 5000 });
});

// WordPress - résultat test = Basique
// Attendu: TOSA Wordpress basique + TOSA Wordpress opérationnel
test('WordPress - Résultat Basique → WordPress basique & WordPress opérationnel', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Wordpress');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Basique');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('WordPress Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /WordPress|Wordpress/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Passer Initial, échouer Basique
  await page.locator('label').nth(1).click();
  await page.locator('label').nth(1).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'WordPress-Basique.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Wordpress (basique|opérationnel)/i, { timeout: 5000 });
});
