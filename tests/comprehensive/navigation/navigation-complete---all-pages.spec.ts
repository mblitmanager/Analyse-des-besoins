import { test, expect } from '@playwright/test';

test.describe('Navigation Complete - All Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey with screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotBase = 'test-results/screenshots/navigation/navigation-complete---all-pages/' + timestamp;

    // Step 1: Page d accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-1--.png`, fullPage: true });

    // Step 2: Questionnaire prerequis
    await page.goto('https://ns-conseil-ab.mbl-service.com/prerequis');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-2--prerequis.png`, fullPage: true });

    // Step 3: Selection formation
    await page.goto('https://ns-conseil-ab.mbl-service.com/formations');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-3--formations.png`, fullPage: true });

    // Step 4: Test de positionnement
    await page.goto('https://ns-conseil-ab.mbl-service.com/positionnement');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-4--positionnement.png`, fullPage: true });

    // Step 5: Mise a niveau
    await page.goto('https://ns-conseil-ab.mbl-service.com/mise-a-niveau');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-5--mise-a-niveau.png`, fullPage: true });

    // Step 6: Voir resultats
    await page.goto('https://ns-conseil-ab.mbl-service.com/resultats');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-6--resultats.png`, fullPage: true });

    // Step 7: Questions complementaires
    await page.goto('https://ns-conseil-ab.mbl-service.com/complementary');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-7--complementary.png`, fullPage: true });

    // Step 8: Disponibilites
    await page.goto('https://ns-conseil-ab.mbl-service.com/availabilities');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-8--availabilities.png`, fullPage: true });

    // Step 9: Validation finale
    await page.goto('https://ns-conseil-ab.mbl-service.com/validation');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-9--validation.png`, fullPage: true });

    // Step 10: Mentions legales
    await page.goto('https://ns-conseil-ab.mbl-service.com/mentions-legales');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-10--mentions-legales.png`, fullPage: true });

    // Step 11: Politique vie privee
    await page.goto('https://ns-conseil-ab.mbl-service.com/respect-vie-privee');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-11--respect-vie-privee.png`, fullPage: true });

    // Step 12: Politique confidentialite
    await page.goto('https://ns-conseil-ab.mbl-service.com/politique-confidentialite');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-12--politique-confidentialite.png`, fullPage: true });

    // Step 13: A propos
    await page.goto('https://ns-conseil-ab.mbl-service.com/about');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-13--about.png`, fullPage: true });

    // Step 14: Documentation
    await page.goto('https://ns-conseil-ab.mbl-service.com/docs');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-14--docs.png`, fullPage: true });

    // Capture finale
    await page.screenshot({ path: `${screenshotBase}-final.png`, fullPage: true });
  });
});
