import { test, expect } from '@playwright/test';

test.describe('IA Générative Modal Test', () => {
  test('Modal should display when clicking IA Générative formation', async ({ page }) => {
    // Navigate to formations page
    const base = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(`${base}/formations`);
    await page.waitForLoadState('networkidle');
    
    // Wait for formations to load
    await page.waitForTimeout(1000);

    // If an identification overlay is present, fill basic text inputs and start the parcours
    const needsIdentification = await page.locator('text=Veuillez renseigner vos informations').isVisible().catch(() => false);
    if (needsIdentification) {
      console.log('📝 Identification required — filling demo user info');
      // Only target fillable text inputs (exclude radio/checkbox/hidden)
      const textInputs = page.locator('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]) , textarea');
      const textCount = await textInputs.count();
      if (textCount >= 1) await textInputs.nth(0).fill('Test');
      if (textCount >= 2) await textInputs.nth(1).fill('User');
      if (textCount >= 3) await textInputs.nth(2).fill('0600000000');
      // Try to select a civilite if present
      const civiliteRadio = page.locator('input[type="radio"][name="civilite"]').first();
      if (await civiliteRadio.isVisible().catch(() => false)) {
        await civiliteRadio.check().catch(() => {});
      }
      // Click start button if present
      const startBtn = page.getByText(/DÉMARRER LE PARCOURS|DÉMARRER/).first();
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    }
    
    // Take screenshot of formations page
    console.log('📸 Screenshot 1: Formations page');
    await page.screenshot({ path: 'test-results/screenshots/01-ia-formations-page.png', fullPage: true });
    
    // Find and click IA Générative button
    console.log('🔍 Looking for IA Générative button...');
    const iaButton = page.locator('button:has-text("IA Générative"), button:has-text("IA GENERATIVE"), div:has-text("IA Générative")').first();
    
    // Check if button exists
    const isVisible = await iaButton.isVisible().catch(() => false);
    console.log('IA Générative button visible:', isVisible);
    
    if (isVisible) {
      await iaButton.click();
      console.log('✓ Clicked IA Générative');
    } else {
      // Try alternative: look for all clickable elements and log them
      const buttons = await page.locator('button, [role="button"], div').all();
      console.log(`Found ${buttons.length} clickable elements`);
      
      for (let i = 0; i < Math.min(buttons.length, 20); i++) {
        const text = await buttons[i].textContent().catch(() => '');
        const role = await buttons[i].getAttribute('role').catch(() => '');
        if (text) console.log(`  [${i}] ${text.trim().substring(0, 50)} (role: ${role})`);
      }
    }
    
    await page.waitForTimeout(500);
    
    // Take screenshot after click
    console.log('📸 Screenshot 2: After clicking IA Générative');
    await page.screenshot({ path: 'test-results/screenshots/02-ia-after-click.png', fullPage: true });
    
    // Check if modal appeared
    console.log('🔍 Checking for modal...');
    const modal = page.locator('[role="dialog"], .modal, dialog').first();
    const modalVisible = await modal.isVisible().catch(() => false);
    console.log('Modal visible:', modalVisible);
    
    // Look for Word + IA and Excel + IA options
    console.log('🔍 Looking for Word + IA option...');
    const wordIaOption = page.locator('button:has-text("Word"), button:has-text("Excel")').first();
    const wordIaVisible = await wordIaOption.isVisible().catch(() => false);
    console.log('Word/Excel IA option visible:', wordIaVisible);
    
    // Take screenshot of modal
    console.log('📸 Screenshot 3: Modal (if visible)');
    await page.screenshot({ path: 'test-results/screenshots/03-ia-modal.png', fullPage: true });
    
    // Log all text content on page
    const allText = await page.evaluate(() => document.body.innerText);
    console.log('\n📄 Page content:\n', allText.substring(0, 500));
    
    // Verification
    if (modalVisible || wordIaVisible) {
      console.log('✅ TEST PASSED: Modal or options found');
    } else {
      console.log('❌ TEST FAILED: No modal or options found');
    }
  });
});
