const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://ns-conseil-ab.mbl-service.com';
const TESTS_DIR = path.join(__dirname, 'tests/comprehensive');
const SCREENSHOTS_DIR = path.join(__dirname, 'test-results/screenshots');

// Scénarios de test complets
const userJourneys = [
  {
    name: 'Navigation Complete - All Pages',
    category: 'navigation',
    steps: [
      { route: '/', action: 'navigate', description: 'Page d accueil' },
      { route: '/prerequis', action: 'navigate', description: 'Questionnaire prerequis' },
      { route: '/formations', action: 'navigate', description: 'Selection formation' },
      { route: '/positionnement', action: 'navigate', description: 'Test de positionnement' },
      { route: '/mise-a-niveau', action: 'navigate', description: 'Mise a niveau' },
      { route: '/resultats', action: 'navigate', description: 'Voir resultats' },
      { route: '/complementary', action: 'navigate', description: 'Questions complementaires' },
      { route: '/availabilities', action: 'navigate', description: 'Disponibilites' },
      { route: '/validation', action: 'navigate', description: 'Validation finale' },
      { route: '/mentions-legales', action: 'navigate', description: 'Mentions legales' },
      { route: '/respect-vie-privee', action: 'navigate', description: 'Politique vie privee' },
      { route: '/politique-confidentialite', action: 'navigate', description: 'Politique confidentialite' },
      { route: '/about', action: 'navigate', description: 'A propos' },
      { route: '/docs', action: 'navigate', description: 'Documentation' },
    ]
  },
  {
    name: 'Navigation Admin Pages',
    category: 'admin',
    steps: [
      { route: '/admin/login', action: 'navigate', description: 'Page login admin' },
      { route: '/admin/dashboard', action: 'navigate', description: 'Dashboard admin' },
      { route: '/admin/sessions', action: 'navigate', description: 'Liste sessions' },
      { route: '/admin/formations', action: 'navigate', description: 'Gestion formations' },
      { route: '/admin/questions', action: 'navigate', description: 'Gestion questions' },
      { route: '/admin/contacts', action: 'navigate', description: 'Gestion contacts' },
      { route: '/admin/settings', action: 'navigate', description: 'Parametres' },
    ]
  },
  {
    name: 'Formation Selection Screenshots',
    category: 'formations',
    steps: [
      { route: '/', action: 'navigate', description: 'Page d accueil' },
      { route: '/formations', action: 'navigate', description: 'Selection formation' },
      { action: 'wait_and_capture', description: 'Capture formations list' },
    ]
  },
  {
    name: 'Workflow Steps Screenshots',
    category: 'workflow',
    steps: [
      { route: '/', action: 'navigate', description: 'Page d accueil' },
      { route: '/prerequis', action: 'navigate', description: 'Step 1 Prerequis' },
      { route: '/formations', action: 'navigate', description: 'Step 2 Formations' },
      { route: '/positionnement', action: 'navigate', description: 'Step 3 Positionnement' },
      { route: '/resultats', action: 'navigate', description: 'Step 4 Resultats' },
      { route: '/validation', action: 'navigate', description: 'Step 5 Validation' },
    ]
  }
];

// Fonction pour générer le template de test
function generateTestTemplate(journey) {
  const testName = journey.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const category = journey.category;
  const screenshotPath = `test-results/screenshots/${category}/${testName}`;
  
  let testCode = `import { test, expect } from '@playwright/test';

test.describe('${journey.name.replace(/'/g, "\\'")}', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('${BASE_URL}');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey with screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotBase = '${screenshotPath}/' + timestamp;
`;

  // Générer les étapes
  journey.steps.forEach((step, index) => {
    const stepNumber = index + 1;
    const safeDescription = step.description.replace(/[^a-zA-Z0-9\s]/g, '');
    
    if (step.action === 'navigate') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    await page.goto('${BASE_URL}${step.route}');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-${step.route.replace(/\//g, '-')}.png\`, fullPage: true });
`;
    } else if (step.action === 'fill_prerequis') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    // Try to find and click radio buttons for civilite
    const radioButtons = await page.locator('input[type="radio"]').count();
    if (radioButtons > 0) {
      await page.locator('input[type="radio"]').first().check();
    }
    
    // Try to fill text inputs
    const textInputs = await page.locator('input[type="text"]').all();
    for (let i = 0; i < Math.min(textInputs.length, 4); i++) {
      try {
        await textInputs[i].fill('Test');
      } catch (e) {
        // Skip if input is not fillable
      }
    }
    
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-form-filled.png\`, fullPage: true });
    
    // Try to find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Suivant"), button:has-text("Continuer")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
    await page.waitForTimeout(2000);
`;
    } else if (step.action === 'select_formation') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    try {
      const formationElement = page.locator(\`text=${step.params.formation}\`).first();
      if (await formationElement.isVisible()) {
        await formationElement.click();
        await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-formation-selected.png\`, fullPage: true });
      }
    } catch (e) {
      // Skip if formation not found
    }
`;
    } else if (step.action === 'complete_positionnement') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    // Select first option for each question
    const questions = await page.locator('.question-item').count();
    for (let i = 0; i < Math.min(questions, 5); i++) {
      const firstOption = page.locator('.question-item').nth(i).locator('input[type="radio"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-questions-answered.png\`, fullPage: true });
    await page.click('button:has-text("Terminer")');
    await page.waitForLoadState('networkidle');
`;
    } else if (step.action === 'check_dashboard_stats') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    await expect(page.locator('.stats-grid')).toBeVisible();
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-dashboard-stats.png\`, fullPage: true });
`;
    } else if (step.action === 'wait_and_capture') {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    await page.waitForTimeout(2000);
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-capture.png\`, fullPage: true });
`;
    } else {
      testCode += `
    // Step ${stepNumber}: ${safeDescription}
    await page.screenshot({ path: \`\${screenshotBase}-step-${stepNumber}-action.png\`, fullPage: true });
`;
    }
  });

  testCode += `
    // Capture finale
    await page.screenshot({ path: \`\${screenshotBase}-final.png\`, fullPage: true });
  });
});
`;

  return testCode;
}

// Fonction pour créer les dossiers
function ensureDirectories() {
  const categories = [...new Set(userJourneys.map(j => j.category))];
  categories.forEach(category => {
    const dir = path.join(TESTS_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const screenshotDir = path.join(SCREENSHOTS_DIR);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  categories.forEach(category => {
    const dir = path.join(SCREENSHOTS_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Fonction principale de génération
function generateTests() {
  console.log('🚀 Génération des tests Playwright complets avec captures d\'écran...');
  
  ensureDirectories();
  
  let totalTests = 0;
  
  userJourneys.forEach(journey => {
    const testName = journey.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const category = journey.category;
    const testFile = path.join(TESTS_DIR, category, `${testName}.spec.ts`);
    
    const testCode = generateTestTemplate(journey);
    fs.writeFileSync(testFile, testCode);
    
    console.log(`✅ Test généré: ${testFile}`);
    totalTests++;
  });
  
  // Générer un README pour les tests
  const readmeContent = `# Tests Playwright Complets avec Captures d'Écran

## 📊 Statistiques
- **Total scénarios**: ${userJourneys.length}
- **Tests générés**: ${totalTests}
- **Catégories**: ${[...new Set(userJourneys.map(j => j.category))].join(', ')}

## 🗂️ Structure
\`\`\`
tests/comprehensive/
├── formations/
│   ├── parcours-complet-anglais.spec.ts
│   ├── parcours-complet-excel.spec.ts
│   ├── parcours-complet-word.spec.ts
│   └── ...
├── admin/
│   └── parcours-admin-dashboard.spec.ts
└── legal/
    └── navigation-pages-legales.spec.ts

test-results/screenshots/
├── formations/
├── admin/
└── legal/
\`\`\`

## 🎯 Scénarios Couverts

${userJourneys.map(j => `- **${j.name}**: ${j.steps.length} étapes`).join('\n')}

## 🚀 Exécution

### Tous les tests
\`\`\`bash
npx playwright test tests/comprehensive/ --project=chromium
\`\`\`

### Par catégorie
\`\`\`bash
npx playwright test tests/comprehensive/formations/ --project=chromium
npx playwright test tests/comprehensive/admin/ --project=chromium
npx playwright test tests/comprehensive/legal/ --project=chromium
\`\`\`

### Avec captures d'écran
\`\`\`bash
npx playwright test tests/comprehensive/ --project=chromium --screenshot=only-on-failure
\`\`\`

### Mode headed (avec fenêtre navigateur)
\`\`\`bash
npx playwright test tests/comprehensive/ --project=chromium --headed
\`\`\`

### Tous les navigateurs
\`\`\`bash
npx playwright test tests/comprehensive/ --reporter=html
\`\`\`

## 📸 Captures d'Écran

Les captures sont organisées par :
- **Catégorie**: formations, admin, legal
- **Scénario**: nom du test
- **Timestamp**: date et heure d'exécution
- **Étape**: numéro de l'étape et description

Exemple: \`test-results/screenshots/formations/parcours-complet-excel/2026-09-25-10-30-45-step-3-formations.png\`

## 🔧 Configuration

URL de base: \`${BASE_URL}\`

Pour changer l'URL:
\`\`\`bash
BASE_URL=https://votre-url.com node generate-comprehensive-playwright-tests.js
\`\`\`

---

Généré le: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(TESTS_DIR, 'README.md'), readmeContent);
  console.log('📄 README généré:', path.join(TESTS_DIR, 'README.md'));
  
  console.log(`\n✨ Génération terminée! ${totalTests} tests Playwright complets générés.`);
  console.log('📁 Dossier tests:', TESTS_DIR);
  console.log('📁 Dossier captures:', SCREENSHOTS_DIR);
}

// Exécution
generateTests();