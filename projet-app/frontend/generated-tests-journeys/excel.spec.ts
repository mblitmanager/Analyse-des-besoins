import { test, expect } from '@playwright/test';

test('Excel - Full User Journey', async ({ page }) => {
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
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Testeur Qualité');
  
  // Employment status
  await page.locator('label').filter({ hasText: 'workSalarié' }).click();
  
  // First digital skill question
  await page.getByText('Quotidiennement').first().click();
  
  // Computer knowledge
  await page.getByText('Savez-vous allumer un').click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  
  // Software usage questions
  await page.locator('label').filter({ hasText: 'Oui' }).nth(2).click();
  await page.getByText('Occasionnellement').nth(1).click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(4).click();
  await page.getByText('Non').nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  
  // ===== STEP 4: VALIDATE PROFILE =====
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 5: FORMATION SELECTION =====
  // Click formation description
  await page.getByRole('button', { name: 'description Excel' }).click();
  await page.waitForLoadState('networkidle');
  
  // Click continue to start course
  await page.getByText('ContinuerContinuerarrow_forward').click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 6: COURSE QUESTIONS =====
  // Answer formation-specific questions
  await page.getByText('Une cellule').click();
  await page.locator('span').filter({ hasText: '=SOMME()' }).click();
  await page.getByText('Camembert (Secteur)').click();
  
  // Navigate through course sections
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForLoadState('networkidle');
  
  await page.locator('label').filter({ hasText: 'L\'icône : $' }).click();
  await page.getByText('A afficher les valeurs').click();
  await page.getByText('SI()').click();
  await page.getByText('conditionnelle').click();
  await page.getByText('AUJOURDHUI()').click();
  
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForLoadState('networkidle');
  
  await page.locator('label').filter({ hasText: 'À effacer les valeurs ne ré' }).click();
  await page.locator('label').filter({ hasText: 'De copier et/ou incrémenter' }).click();
  await page.getByText('Un segment').click();
  await page.getByText('Données', { exact: true }).click();
  await page.getByText('Je protège le classeur').click();
  
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForLoadState('networkidle');
  
  // Continue after course content
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 7: PARCOURS SELECTION =====
  // Select the training variant/parcours
  await page.getByRole('button', { name: 'Renforcement EXCEL' }).click();
  
  // Validate parcours
  await page.getByRole('button', { name: 'Valider ce parcours et' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 8: MOTIVATION & OBJECTIVES =====
  // Motivation dropdown
  await page.getByRole('combobox').selectOption('Je vise un emploi pour lequel de nouvelles compétences me seront utiles');
  
  // Additional questions
  await page.getByText('Non').first().click();
  await page.locator('label').nth(2).click();
  
  // ===== STEP 9: AVAILABILITY SELECTION =====
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  await page.waitForLoadState('networkidle');
  
  // Select time availability
  await page.getByText('Après-midi').click();
  
  // Validate availabilities
  await page.getByRole('button', { name: 'Valider mes disponibilités' }).click();
  await page.waitForLoadState('networkidle');
  
  // ===== STEP 10: FINAL VALIDATION =====
  // Navigate to validation page
  await page.goto('http://localhost:5173/validation');
  await page.waitForLoadState('networkidle');
  
  // Confirm final choice
  await page.getByRole('button', { name: 'Oui, avec plaisir !' }).click();
  await page.waitForLoadState('networkidle');
  
  // Finalize
  await page.getByRole('button', { name: 'Valider ce choix' }).click();
  
  // Verify success - should redirect or show confirmation
  await page.waitForURL(/validation|confirmation|success/);
});
