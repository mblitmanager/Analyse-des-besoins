import { test, expect } from '@playwright/test';

test.describe('Navigation Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('https://ns-conseil-ab.mbl-service.com');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey with screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotBase = 'test-results/screenshots/admin/navigation-admin-pages/' + timestamp;

    // Step 1: Page login admin
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-1--admin-login.png`, fullPage: true });

    // Step 2: Dashboard admin
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-2--admin-dashboard.png`, fullPage: true });

    // Step 3: Liste sessions
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/sessions');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-3--admin-sessions.png`, fullPage: true });

    // Step 4: Gestion formations
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/formations');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-4--admin-formations.png`, fullPage: true });

    // Step 5: Gestion questions
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/questions');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-5--admin-questions.png`, fullPage: true });

    // Step 6: Gestion contacts
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/contacts');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-6--admin-contacts.png`, fullPage: true });

    // Step 7: Parametres
    await page.goto('https://ns-conseil-ab.mbl-service.com/admin/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotBase}-step-7--admin-settings.png`, fullPage: true });

    // Capture finale
    await page.screenshot({ path: `${screenshotBase}-final.png`, fullPage: true });
  });
});
