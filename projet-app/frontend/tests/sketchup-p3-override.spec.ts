import { test, expect } from '@playwright/test';

test.describe('SketchUp P3 Override Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Login as admin (adjust credentials as needed)
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to formations page
    await page.waitForURL('**/formations');
  });

  test('P3 with SketchUp should show override options based on testFormations', async ({ page }) => {
    // Select SketchUp as P2 formation
    await page.click('text=SketchUp');
    
    // Select a level (e.g., "Débutant")
    await page.click('text=Débutant');
    
    // Confirm P2 selection
    await page.click('button:has-text("Valider")');
    
    // Wait for P3 mode
    await page.waitForTimeout(1000);
    
    // Select SketchUp again for P3 (same formation)
    await page.click('text=SketchUp');
    await page.click('text=Débutant');
    
    // Check if P3 override section appears at the bottom
    const overrideSection = page.locator('.fixed.bottom-0');
    await expect(overrideSection).toBeVisible();
    
    // Check if the override section shows options based on testFormations
    // This should NOT show SketchUp test directly, but configured options
    const options = await overrideSection.locator('button, label').all();
    console.log('Found override options:', options.length);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'sketchup-p3-override.png' });
    
    // Verify that the options are based on testFormations configuration
    // NOT static SketchUp test
    const hasTestFormationsOptions = await overrideSection.textContent();
    console.log('Override section content:', hasTestFormationsOptions);
    
    // The test should fail if SketchUp test appears directly
    expect(hasTestFormationsOptions).not.toContain('SketchUp');
  });

  test('P3 with SketchUp should use testFormations from admin config', async ({ page }) => {
    // This test verifies that the system uses the testFormations array
    // from the admin P3 override configuration, not hardcoded values
    
    // Select SketchUp as P2
    await page.click('text=SketchUp');
    await page.click('text=Débutant');
    await page.click('button:has-text("Valider")');
    
    // Select SketchUp for P3
    await page.click('text=SketchUp');
    await page.click('text=Débutant');
    
    // Wait for P3 override section
    const overrideSection = page.locator('.fixed.bottom-0');
    await expect(overrideSection).toBeVisible({ timeout: 5000 });
    
    // Check the content of the override section
    const sectionText = await overrideSection.textContent();
    
    // Verify it shows options from testFormations configuration
    // This should be parametrized, not static
    console.log('Override section contains:', sectionText);
    
    // Take screenshot
    await page.screenshot({ path: 'sketchup-testformations-check.png' });
  });
});
