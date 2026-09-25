import { test, expect } from '@playwright/test';

test.describe('Workflow Steps Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey with screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotBase = 'test-results/screenshots/workflow/workflow-steps-screenshots/' + timestamp;

    // Step 1: Page d accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-1--.png`, fullPage: true });

    // Step 2: Step 1 Prerequis
    await page.goto('https://ns-conseil-ab.mbl-service.com/prerequis');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-2--prerequis.png`, fullPage: true });

    // Step 3: Step 2 Formations
    await page.goto('https://ns-conseil-ab.mbl-service.com/formations');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-3--formations.png`, fullPage: true });

    // Step 4: Step 3 Positionnement
    await page.goto('https://ns-conseil-ab.mbl-service.com/positionnement');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-4--positionnement.png`, fullPage: true });

    // Step 5: Step 4 Resultats
    await page.goto('https://ns-conseil-ab.mbl-service.com/resultats');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-5--resultats.png`, fullPage: true });

    // Step 6: Step 5 Validation
    await page.goto('https://ns-conseil-ab.mbl-service.com/validation');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-6--validation.png`, fullPage: true });

    // Capture finale
    await page.screenshot({ path: `${screenshotBase}-final.png`, fullPage: true });
  });
});
