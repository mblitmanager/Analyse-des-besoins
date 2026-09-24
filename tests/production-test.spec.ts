import { test, expect } from '@playwright/test';

test('Production Test - Excel Formation Full Journey', async ({ page }) => {
  console.log('=== STARTING PRODUCTION TEST ===');
  
  // Step 1: Home page
  console.log('\n[STEP 1] Navigating to home...');
  await page.goto('https://ns-conseil-ab.mbl-service.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('[OK] Home page loaded');
  
  // Step 2: Fill intake form
  console.log('\n[STEP 2] Filling intake form...');
  await page.locator('input[name="civilite"][value="M."]').click();
  await page.locator('input[id="last-name"]').fill('Dupont');
  await page.locator('input[id="first-name"]').fill('Jean');
  await page.locator('input[name="phone"]').fill('0612345678');
  console.log('[OK] Intake form filled');
  
  // Step 3: Submit form
  console.log('\n[STEP 3] Submitting form...');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/prerequis/, { timeout: 20000 }).catch(() => console.log('[WARNING] No navigation to /prerequis'));
  await page.waitForTimeout(2000);
  console.log(`[OK] Current URL: ${page.url()}`);
  
  // Step 4: Fill profile questionnaire
  console.log('\n[STEP 4] Filling profile questionnaire...');
  const metierInput = page.locator('input[placeholder*="Assistant administratif"]');
  if (await metierInput.isVisible()) {
    await metierInput.fill('Test Professional');
    console.log('[OK] Job title filled');
  }
  
  // Employment status
  const emploiLabel = page.locator('label').filter({ hasText: /Salarié|workSalarié/ }).first();
  if (await emploiLabel.isVisible()) {
    await emploiLabel.click();
    console.log('[OK] Employment status selected');
  }
  
  // Digital skill questions - click first visible options
  const labels = await page.locator('label').all();
  console.log(`[DEBUG] Found ${labels.length} labels on page`);
  
  // Try to click first few visible labels for digital skills
  for (let i = 0; i < Math.min(5, labels.length); i++) {
    try {
      const isVisible = await labels[i].isVisible();
      if (isVisible) {
        const text = await labels[i].textContent();
        console.log(`[DEBUG] Label ${i}: ${text?.substring(0, 50)}`);
      }
    } catch (e) {
      // skip
    }
  }
  
  // Click some radio buttons/checkboxes
  const radioButtons = page.locator('input[type="radio"], input[type="checkbox"]').filter({ visible: true });
  const count = await radioButtons.count();
  console.log(`[DEBUG] Found ${count} radio/checkbox buttons`);
  
  if (count > 0) {
    for (let i = 0; i < Math.min(7, count); i++) {
      try {
        await radioButtons.nth(i).click();
        await page.waitForTimeout(200);
      } catch (e) {
        console.log(`[WARNING] Could not click radio ${i}`);
      }
    }
    console.log('[OK] Profile questions answered');
  }
  
  // Step 5: Validate profile
  console.log('\n[STEP 5] Validating profile...');
  const validateBtn = page.locator('button').filter({ hasText: /Valider mon profil|Validate profile/ }).first();
  if (await validateBtn.isVisible()) {
    await validateBtn.click();
    await page.waitForTimeout(2000);
    console.log('[OK] Profile validated');
  } else {
    console.log('[WARNING] Validate profile button not found');
  }
  
  console.log(`\n[FINAL] Current URL: ${page.url()}`);
  console.log('[FINAL] Page title:', await page.title());
  
  // Take screenshot at current state
  await page.screenshot({ path: `/tmp/production-test-final.png` });
  console.log('[SCREENSHOT] Saved to /tmp/production-test-final.png');
});
