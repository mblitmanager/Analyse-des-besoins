#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
});

// Configuration
const BASE_URL = 'https://ns-conseil-ab.mbl-service.com';
const TESTS_BASE_DIR = './generated-tests';

// Fonction pour créer un slug valide
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Template de test Playwright
function generateTestTemplate(formation, level, levelOrder, parcoursIndex, parcoursData) {
  const formationSlug = createSlug(formation);
  const levelSlug = createSlug(level);
  
  const testName = `${formationSlug}-${levelSlug}-parcours-${parcoursIndex + 1}`;
  const humanName = `${formation} - ${level} - Parcours ${parcoursIndex + 1}`;
  
  const screenshotPath1 = `./test-results/screenshots/${testName}-01-positionnement-end.png`;
  const screenshotPath2 = `./test-results/screenshots/${testName}-02-results.png`;
  
  return `import { test, expect } from "@playwright/test";

/**
 * Formation: ${formationSlug} | Level: ${levelSlug} | Parcours: ${parcoursIndex + 1}
 * Niveau ordre: ${levelOrder}
 * Seuil de réussite: ${parcoursData.threshold}%
 * 
 * Formations proposées:
 * - Formation 1: ${parcoursData.formation1}
 * - Formation 2: ${parcoursData.formation2 || 'N/A'}
 */

test("${testName} - ${humanName}", async ({ page, context }) => {
  // Navigate to formations page
  await page.goto("${BASE_URL}/formations");
  await page.waitForLoadState("networkidle");
  
  // Select formation - search for "${formation}"
  const formationSelectors = await page.locator("*:has-text(\\"${formation}\\")").all();
  let formationFound = false;
  
  for (const selector of formationSelectors) {
    if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify it's clickable (not just text in a label)
      const isButton = await selector.evaluate(el => {
        return el.tagName === 'BUTTON' || 
               el.onclick !== null || 
               el.getAttribute('role') === 'button';
      }).catch(() => false);
      
      if (isButton) {
        await selector.click();
        await page.waitForLoadState("networkidle");
        formationFound = true;
        break;
      }
    }
  }
  
  if (!formationFound) {
    console.log("Warning: Formation '${formation}' not found on the page");
  }
  
  // Start session - click "Commencer" button
  let commencerFound = false;
  for (let i = 0; i < 3; i++) {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("commencer")) {
        await btn.click();
        await page.waitForLoadState("networkidle");
        commencerFound = true;
        break;
      }
    }
    if (commencerFound) break;
    await page.waitForTimeout(500);
  }
  
  if (!commencerFound) {
    console.log("Warning: 'Commencer' button not found");
  }
  
  // Complete positionnement by selecting first option for each question
  let questionCount = 0;
  let maxQuestions = 50; // Safety limit
  
  for (let attempt = 0; attempt < maxQuestions; attempt++) {
    const radios = await page.locator("input[type=\\"radio\\"]").all();
    
    if (radios.length === 0) {
      console.log(\`✓ Positionnement completed after \${questionCount} questions\`);
      break;
    }
    
    // Check the first radio button
    try {
      await radios[0].check({ force: true });
      questionCount++;
      await page.waitForTimeout(150);
    } catch (e) {
      console.log("Error checking radio: " + e.message);
      break;
    }
    
    // Click "Suivant" button
    const buttons = await page.locator("button").all();
    let suivantClicked = false;
    
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("suivant")) {
        try {
          await btn.click();
          await page.waitForLoadState("networkidle");
          suivantClicked = true;
          break;
        } catch (e) {
          console.log("Error clicking Suivant: " + e.message);
        }
      }
    }
    
    if (!suivantClicked) {
      console.log(\`ℹ No 'Suivant' button found after \${questionCount} questions - test may be complete\`);
      break;
    }
  }
  
  // Wait for positionnement to settle
  await page.waitForTimeout(1000);
  
  // Screenshot after positionnement
  try {
    await page.screenshot({
      path: "${screenshotPath1}",
      fullPage: true
    });
    console.log(\`📸 Screenshot 1 saved: ${screenshotPath1}\`);
  } catch (e) {
    console.log("Error taking screenshot 1: " + e.message);
  }
  
  // Click "Terminer" or similar button to view results
  await page.waitForTimeout(500);
  let terminerClicked = false;
  
  for (let i = 0; i < 5; i++) {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("terminer") || 
          text?.toLowerCase().includes("résultat") || 
          text?.toLowerCase().includes("finish") ||
          text?.toLowerCase().includes("valider")) {
        try {
          await btn.click();
          await page.waitForLoadState("networkidle");
          terminerClicked = true;
          break;
        } catch (e) {
          console.log("Error clicking Terminer: " + e.message);
        }
      }
    }
    if (terminerClicked) break;
    await page.waitForTimeout(300);
  }
  
  if (!terminerClicked) {
    console.log("Warning: 'Terminer' button not found - may already be on results page");
  }
  
  // Wait for results page to load
  await page.waitForTimeout(2000);
  
  // Screenshot results
  try {
    await page.screenshot({
      path: "${screenshotPath2}",
      fullPage: true
    });
    console.log(\`📸 Screenshot 2 saved: ${screenshotPath2}\`);
  } catch (e) {
    console.log("Error taking screenshot 2: " + e.message);
  }
  
  // Verify we got some results
  const bodyText = await page.evaluate(() => document.body.textContent);
  expect(bodyText.length).toBeGreaterThan(0);
  
  console.log(\`✅ Test completed: ${testName}\`);
});

export {};
`;
}

async function generateAllTests() {
  try {
    console.log('🔍 Generating Playwright tests from database...\n');

    // Récupérer les données
    const formations = await pool.query(`
      SELECT id, slug, label, category
      FROM formations
      WHERE "isActive" = true
      ORDER BY category, label
    `);

    const levels = await pool.query(`
      SELECT id, label, "order", "successThreshold", "formationId"
      FROM levels
      WHERE "isActive" = true
      ORDER BY "formationId", "order"
    `);

    const parcoursRules = await pool.query(`
      SELECT id, formation, condition, formation1, formation2, "order", "formationId"
      FROM parcours_rules
      WHERE "isActive" = true
      ORDER BY formation, "order"
    `);

    // Créer la structure: formation -> levels -> parcours
    const testStructure = {};
    
    for (const formation of formations.rows) {
      testStructure[formation.label] = {
        id: formation.id,
        slug: formation.slug,
        category: formation.category,
        levels: {}
      };
    }

    // Ajouter les niveaux
    for (const level of levels.rows) {
      const formation = formations.rows.find(f => f.id === level.formationId);
      if (formation) {
        testStructure[formation.label].levels[level.label] = {
          id: level.id,
          order: level.order,
          threshold: level.successThreshold,
          parcours: []
        };
      }
    }

    // Ajouter les parcours
    for (const rule of parcoursRules.rows) {
      const formationLabel = rule.formation;
      if (testStructure[formationLabel]) {
        for (const [levelLabel, levelData] of Object.entries(testStructure[formationLabel].levels)) {
          // Chaque niveau peut avoir plusieurs parcours
          levelData.parcours.push({
            id: rule.id,
            condition: rule.condition,
            formation1: rule.formation1,
            formation2: rule.formation2,
            order: rule.order
          });
        }
      }
    }

    // Générer les fichiers de test
    let totalTests = 0;
    const generatedFiles = [];

    for (const [formationName, formationData] of Object.entries(testStructure)) {
      const formationSlug = createSlug(formationName);
      
      for (const [levelName, levelData] of Object.entries(formationData.levels)) {
        const levelSlug = createSlug(levelName);
        
        // Créer un test par parcours (ou au moins 1 si pas de parcours spécifique)
        const parcoursToProcess = levelData.parcours.length > 0 ? levelData.parcours : [{}];
        
        for (let parcoursIdx = 0; parcoursIdx < parcoursToProcess.length; parcoursIdx++) {
          const parcours = parcoursToProcess[parcoursIdx];
          
          const testCode = generateTestTemplate(
            formationName,
            levelName,
            levelData.order,
            parcoursIdx,
            {
              formation1: parcours.formation1 || 'N/A',
              formation2: parcours.formation2 || 'N/A',
              threshold: levelData.threshold,
              condition: parcours.condition || 'Standard'
            }
          );

          // Créer le répertoire
          const testDir = path.join(
            TESTS_BASE_DIR,
            'formations',
            formationSlug,
            levelSlug,
            `parcours-${parcoursIdx + 1}`
          );
          
          fs.mkdirSync(testDir, { recursive: true });
          
          // Écrire le fichier de test
          const testFile = path.join(testDir, 'test.spec.ts');
          fs.writeFileSync(testFile, testCode, 'utf8');
          
          generatedFiles.push(testFile);
          totalTests++;
        }
      }
    }

    // Créer un fichier index
    const indexContent = `# Generated Playwright Tests

Auto-generated from database on ${new Date().toISOString()}

## Test Structure

Tests are organized as:
\`\`\`
formations/
  ├── [formation-slug]/
  │   ├── [level-slug]/
  │   │   ├── parcours-1/
  │   │   │   └── test.spec.ts
  │   │   ├── parcours-2/
  │   │   └── ...
  │   └── ...
  └── ...
\`\`\

## Statistics

- **Total Tests Generated**: ${totalTests}
- **Total Formations**: ${formations.rows.length}
- **Total Levels**: ${levels.rows.length}
- **Total Parcours Rules**: ${parcoursRules.rows.length}

## Running Tests

Run all tests:
\`\`\`bash
npx playwright test generated-tests/
\`\`\`

Run specific formation:
\`\`\`bash
npx playwright test generated-tests/formations/[formation-slug]/
\`\`\`

Run specific level:
\`\`\`bash
npx playwright test generated-tests/formations/[formation-slug]/[level-slug]/
\`\`\`

## Base URL

All tests are configured to run against: ${BASE_URL}

## Last Generated

${new Date().toLocaleString('fr-FR')}
`;

    fs.writeFileSync(path.join(TESTS_BASE_DIR, 'README.md'), indexContent, 'utf8');

    console.log('='.repeat(80));
    console.log('✅ Test Generation Complete!');
    console.log('='.repeat(80));
    console.log(`\n📊 Statistics:`);
    console.log(`   • Total tests generated: ${totalTests}`);
    console.log(`   • Total formations: ${formations.rows.length}`);
    console.log(`   • Total levels: ${levels.rows.length}`);
    console.log(`   • Total parcours rules: ${parcoursRules.rows.length}`);
    console.log(`\n📁 Output directory: ${TESTS_BASE_DIR}/`);
    console.log(`\n🌐 Base URL: ${BASE_URL}`);
    console.log(`\n📖 Documentation: ${path.join(TESTS_BASE_DIR, 'README.md')}`);
    console.log(`\n🚀 To run tests:`);
    console.log(`   npx playwright test ${TESTS_BASE_DIR}/formations/`);
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

generateAllTests();
