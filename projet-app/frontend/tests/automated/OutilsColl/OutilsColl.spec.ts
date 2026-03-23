import { test, expect } from '@playwright/test';

// Outils Coll - Résultat test = Initial (Formation 1 et 2 identiques)
// Attendu: ICDL Outils Coll + ICDL Outils Coll
test('Outils Coll - Résultat Initial → ICDL Outils Coll & ICDL Outils Coll', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Outils');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Coll');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Outils Coll Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Outils Coll|Collaboration/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Répondre incorrectement → rester à Initial
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'OutilsColl-Initial.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/ICDL Outils Coll/i, { timeout: 5000 });
});

// Outils Coll - Résultat test = Initial ou Basique
// Attendu: ICDL OUTILS COLL  (Formation 1 = 2)
test('Outils Coll - Résultat Basique ou Opérationnel → ICDL Outils Coll (identique)', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Outils');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('CollBasique');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Outils Coll Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Oui avec quelques difficultés').nth(1).click();
  await page.locator('label').filter({ hasText: 'Quotidiennement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Outils Coll|Collaboration/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Passer Initial, échouer Basique
  await page.locator('label').nth(1).click();
  await page.locator('label').nth(1).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'OutilsColl-Basique.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/ICDL (OUTILS COLL|Outils Coll)/i, { timeout: 5000 });
});
