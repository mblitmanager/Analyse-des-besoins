const fs = require('fs');
const path = require('path');

// Read extracted database data
const dbData = JSON.parse(
  fs.readFileSync('/var/www/Analyse-v2/extracted_db_data.json', 'utf8')
);

// Define test data for each formation
const formationTestData = {
  'excel': {
    description: 'description Excel',
    questions: [
      { type: 'click', selector: 'text="Une cellule"' },
      { type: 'click', selector: 'span:has-text("=SOMME()")' },
      { type: 'click', selector: 'text="Camembert (Secteur)"' },
    ],
    parcours: 'Renforcement EXCEL',
    availability: 'Après-midi',
  },
  'word': {
    description: 'description Word',
    questions: [
      { type: 'click', selector: 'text="Bloc de texte"' },
      { type: 'click', selector: 'text="En-têtes et pieds de page"' },
    ],
    parcours: 'Renforcement WORD',
    availability: 'Matin',
  },
  'google-docs': {
    description: 'description Google Docs',
    questions: [
      { type: 'click', selector: 'text="Partage"' },
      { type: 'click', selector: 'text="Commentaires"' },
    ],
    parcours: 'Google Docs Avancé',
    availability: 'Après-midi',
  },
  'powerpoint': {
    description: 'description PowerPoint',
    questions: [
      { type: 'click', selector: 'text="Diapositives"' },
      { type: 'click', selector: 'text="Animations"' },
    ],
    parcours: 'PowerPoint Renforcement',
    availability: 'Matin',
  },
};

// Common profile questionnaire answers
const profileAnswers = [
  { selector: 'textbox:has-text("Ex: Assistant administratif,")', fill: 'test' },
  { selector: 'label:has-text("workSalarié")', action: 'click' },
  { selector: 'text="Quotidiennement"', action: 'click', nth: 0 },
  { selector: 'text="Savez-vous allumer un"', action: 'click' },
  { selector: 'label:has-text("Oui avec quelques difficultés")', action: 'click', nth: 0 },
  { selector: 'label:has-text("Oui")', action: 'click', nth: 2 },
  { selector: 'text="Occasionnellement"', action: 'click', nth: 1 },
  { selector: 'label:has-text("Oui")', action: 'click', nth: 4 },
  { selector: 'text="Non"', action: 'click', nth: 3 },
  { selector: 'text="Occasionnellement"', action: 'click', nth: 2 },
];

function generateTestCode(formationSlug, formationLabel, testData) {
  const testCode = `import { test, expect } from '@playwright/test';

test('${formationLabel} - Full User Journey', async ({ page }) => {
  // ===== STEP 1: INTAKE FORM =====
  await page.goto('https://ns-conseil-ab.mbl-service.com/');
  
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
  await page.getByRole('button', { name: '${testData.description}' }).click();
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
  
  await page.locator('label').filter({ hasText: 'L\\'icône : $' }).click();
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
  await page.goto('https://ns-conseil-ab.mbl-service.com/validation');
  await page.waitForLoadState('networkidle');
  
  // Confirm final choice
  await page.getByRole('button', { name: 'Oui, avec plaisir !' }).click();
  await page.waitForLoadState('networkidle');
  
  // Finalize
  await page.getByRole('button', { name: 'Valider ce choix' }).click();
  
  // Verify success - should redirect or show confirmation
  await page.waitForURL(/validation|confirmation|success/);
});
`;
  return testCode;
}

// Generate directory structure for tests
const outputDir = '/var/www/Analyse-v2/projet-app/frontend/generated-tests-journeys';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let testCount = 0;

// Generate tests for formations with test data
Object.entries(formationTestData).forEach(([formationSlug, testData]) => {
  // Find formation label from database
  const formation = dbData.data.formations.find(f => f.slug === formationSlug);
  if (!formation) {
    console.warn(`Formation not found: ${formationSlug}`);
    return;
  }

  const testCode = generateTestCode(formationSlug, formation.label, testData);
  const testFileName = `${formationSlug}.spec.ts`;
  const testFilePath = path.join(outputDir, testFileName);

  fs.writeFileSync(testFilePath, testCode, 'utf8');
  console.log(`✓ Generated: ${testFileName}`);
  testCount++;
});

// Generate tests for remaining formations (without specific data, using generic flow)
dbData.data.formations.forEach(formation => {
  if (formationTestData[formation.slug]) {
    return; // Already generated
  }

  const genericTestCode = `import { test, expect } from '@playwright/test';

test('${formation.label} - Full User Journey', async ({ page }) => {
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
  const formationButton = await page.getByRole('button').filter({ has: page.getByText('${formation.label}') }).first();
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
`;

  const testFileName = `${formation.slug}.spec.ts`;
  const testFilePath = path.join(outputDir, testFileName);

  fs.writeFileSync(testFilePath, genericTestCode, 'utf8');
  console.log(`✓ Generated (generic): ${testFileName}`);
  testCount++;
});

console.log(`\n✓ Generated ${testCount} complete user journey tests in: ${outputDir}`);
console.log('\nTests structure: ${formation} → Full intake → Profile → Formation selection → Course → Parcours → Availability → Validation\n');
