import { test, expect } from '@playwright/test';

// PPT + Prérequis informatique KO (réponses = "Non")
// Attendu: TOSA Digcomp Initial + TOSA PPT Initial
test('PPT - Prereq KO → DigComp Initial + PPT Initial', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('PPT');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Initial KO');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0606060606');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('PPT Test');
  await page.locator('label').filter({ hasText: /Salarié/ }).click();
  // Prérequis KO : choisir "Jamais" et "Non" partout pour simuler l'échec
  await page.getByText('Jamais').first().click();
  await page.getByText('Non').first().click();
  await page.getByText('Non').nth(1).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(1).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(2).click();
  await page.getByText('Non').nth(3).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  // La règle prérequis KO doit orienter vers DigComp + PPT Initial
  await page.getByRole('button', { name: /PowerPoint|PPT/i }).click();
  // Répondre faux à toutes les questions du test de positionnement (Initial)
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // Répondre aux questions incorrectement pour rester à Initial
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.locator('label').first().click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'PPT-InitialKO-result.png', fullPage: true });
  // Assertion: vérifier le parcours recommandé
  const recommendation = page.locator('h3.text-xl, .text-brand-primary.font-extrabold').first();
  await expect(recommendation).toContainText(/PPT Initial|Digcomp Initial/i, { timeout: 5000 });
});
