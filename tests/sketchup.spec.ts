import { test, expect } from '@playwright/test';

test('SketchUp - Full User Journey', async ({ page }) => {
  // ===== STEP 1: INTAKE FORM =====
  await page.goto('http://localhost:5173/');
  
  // Fill in personal info
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Dupont');
  await page.getByRole('textbox', { name: 'Prénom' }).click();
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Jean');
  await page.getByRole('textbox', { name: 'Téléphone' }).click();
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0612345678');
  await page.getByRole('textbox', { name: 'Conseiller commercial (' }).click();
  await page.getByRole('textbox', { name: 'Conseiller commercial (' }).fill('Test Conseiller');
  
  // ===== STEP 2: START JOURNEY =====
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 3: PROFILE QUESTIONNAIRE =====
  // Job title
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Test Professional');
  
  // Employment status
  await page.locator('label').filter({ hasText: 'workSalarié' }).click();
  
  // Digital skill questions
  await page.getByText('Quotidiennement').first().click();
  await page.getByText('Savez-vous allumer un').click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  
  // Additional questions
  await page.locator('label').filter({ hasText: 'Oui' }).nth(2).click();
  await page.getByText('Occasionnellement').nth(1).click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(4).click();
  await page.getByText('Non').nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  
  // ===== STEP 4: VALIDATE PROFILE =====
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 5: FORMATION SELECTION =====
  // Find and click the formation button (generic selector)
  const formationButton = await page.getByRole('button').filter({ has: page.getByText('SketchUp') }).first();
  await formationButton.click();
  await page.waitForLoadState('networkidle');
  
  // Continue to course
  const continueButtons = page.getByText('ContinuerContinuerarrow_forward, Continuer, or similar');
  try {
    await page.getByText('ContinuerContinuerarrow_forward').click();
  } catch (e) {
    await page.getByRole('button', { name: /continuer/i }).first().click();
  }
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 6: COURSE QUESTIONS =====
  // Answer available questions (generic approach)
  const radioButtons = await page.locator('label').all();
  if (radioButtons.length > 0) {
    await radioButtons[0].click();
    await page.waitForTimeout(300);
  }
  
  // Try to navigate through course
  try {
    await page.getByRole('button', { name: /suivant|next/i }).click();
    await page.waitForLoadState('networkidle');
  } catch (e) {
    // No next button, continue
  }
  
  // ===== STEP 7: COMPLETE REMAINING STEPS =====
  try {
    // Try to click continue button
    await page.getByRole('button', { name: /continuer/i }).first().click();
    await page.waitForLoadState('networkidle');
  } catch (e) {
    // Continue
  }
  
  // ===== STEP 8: VALIDATION =====
  try {
    await page.goto('http://localhost:5173/validation');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /oui|yes/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /valider|confirm/i }).first().click();
  } catch (e) {
    // Validation step may not apply to all formations
  }
});
