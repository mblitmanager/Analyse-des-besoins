import { test, expect } from '@playwright/test';

// Illustrator - Prérequis KO <= Initial
// Attendu: TOSA Illustrator initial + TOSA Illustrator basique
test('Illustrator - Prereq KO → Illustrator initial & Illustrator basique', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Illustrator');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('InitialKO');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Illustrator Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  // Prérequis KO
  await page.getByText('Jamais').first().click();
  await page.getByText('Non').first().click();
  await page.getByText('Non').nth(1).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(1).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(2).click();
  await page.getByText('Non').nth(3).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: /Illustrator/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'Illustrator-InitialKO.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Illustrator (initial|basique)/i, { timeout: 5000 });
});

// Illustrator - Résultat = Basique
// Attendu: TOSA Illustrator basique + TOSA Illustrator opérationnel
test('Illustrator - Résultat Basique → Illustrator basique & Illustrator opérationnel', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Illustrator');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Basique');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Illustrator Test');
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
  await page.getByRole('button', { name: /Illustrator/i }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Passer Initial, échouer Basique
  await page.locator('label').nth(1).click();
  await page.locator('label').nth(1).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'Illustrator-Basique.png', fullPage: true });
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/Illustrator (basique|opérationnel)/i, { timeout: 5000 });
});
