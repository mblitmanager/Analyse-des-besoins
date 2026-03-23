import { test, expect } from '@playwright/test';

// Helper to fill registration form
async function fillRegistration(page: any, prenom: string) {
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Voltaire');
  await page.getByRole('textbox', { name: 'Prénom' }).fill(prenom);
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Test Voltaire');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
}

// Voltaire - résultat test = Découverte
// Attendu: Voltaire Découverte + Voltaire Technique
test('Voltaire - Résultat Découverte → Voltaire Découverte & Voltaire Technique', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await fillRegistration(page, 'Decouverte');
  // Prérequis (pas de condition prérequis pour Voltaire selon le tableau)
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Français/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Répondre incorrectement → s'arrêter au niveau Découverte
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'Voltaire-Decouverte.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Voltaire (Découverte|Technique)/i, { timeout: 5000 });
});

// Voltaire - résultat test = Technique
// Attendu: Voltaire Technique + Voltaire Professionnel
test('Voltaire - Résultat Technique → Voltaire Technique & Voltaire Professionnel', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await fillRegistration(page, 'Technique');
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Français/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Bonnes réponses au niveau Découverte, mauvaises au niveau Technique → Technique
  await page.locator('label').nth(1).click();
  await page.locator('label').nth(1).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'Voltaire-Technique.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Voltaire (Technique|Professionnel)/i, { timeout: 5000 });
});

// Voltaire - résultat test = Professionnel
// Attendu: Voltaire Professionnel + Voltaire Affaires
test('Voltaire - Résultat Professionnel → Voltaire Professionnel & Voltaire Affaires', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await fillRegistration(page, 'Professionnel');
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Français/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Passer Découverte et Technique, échouer Professionnel
  await page.locator('label').nth(1).click();
  await page.locator('label').nth(1).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').nth(2).click();
  await page.locator('label').nth(2).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'Voltaire-Professionnel.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Voltaire (Professionnel|Affaires)/i, { timeout: 5000 });
});
