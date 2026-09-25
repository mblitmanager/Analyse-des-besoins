import { test, expect } from '@playwright/test';

test.describe('Formation Selection Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey with screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotBase = 'test-results/screenshots/formations/formation-selection-screenshots/' + timestamp;

    // Step 1: Page d accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-1--.png`, fullPage: true });

    // Step 2: Selection formation
    await page.goto('https://ns-conseil-ab.mbl-service.com/formations');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-2--formations.png`, fullPage: true });

    // Step 3: Capture formations list
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotBase}-step-3-capture.png`, fullPage: true });

    // Capture finale
    await page.screenshot({ path: `${screenshotBase}-final.png`, fullPage: true });
  });
});
