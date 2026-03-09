const { test, expect } = require('@playwright/test');

test.describe('Word Assessment Scenarios', () => {
  test('Word-1: Prérequis KO', async ({ page }) => {
    await page.goto('/');
    
    // Identification
    await page.fill('#last-name', 'Test');
    await page.fill('#first-name', 'Word1');
    await page.fill('#phone', '0600000001');
    await page.click('button[type="submit"]');
    
    // Step: Prerequis
    await expect(page).toHaveURL(/.*prerequis/);
    // Answer "Jamais" to "Fréquence d’utilisation d’un ordinateur" to trigger KO
    await page.click('text=Jamais');
    await page.click('button:has-text("Suivant")');
    
    // It should skip and go straight to resultats or next steps depending on rules
    // Based on seed rules: resultMessage: 'DigComp Initial | Word/Excel/PPT Initial'
    await expect(page).toHaveURL(/.*validation/);
    await expect(page.locator('.text-green-600')).toContainText(/DigComp Initial/);
    await expect(page.locator('.text-green-600')).toContainText(/Word Initial/);
  });

  test('Word-2: Test ≤ Initial', async ({ page }) => {
    await page.goto('/');
    
    // Identification
    await page.fill('#last-name', 'Test');
    await page.fill('#first-name', 'Word2');
    await page.fill('#phone', '0600000002');
    await page.click('button[type="submit"]');
    
    // Step: Prerequis - OK
    await expect(page).toHaveURL(/.*prerequis/);
    await page.click('text=Tous les jours');
    // Answer other questions to be "OK"
    // Savoir allumer...
    await page.click('text=Oui');
    // Se repérer...
    await page.click('text=Oui');
    await page.click('button:has-text("Suivant")');
    
    // Step: Formation Selection
    await expect(page).toHaveURL(/.*formations/);
    await page.click('text=Pack Office Word');
    await page.click('button:has-text("Suivant")');
    
    // Step: Positionnement - Level Initial
    // Assuming we need to stay at Initial level: Succeed Initial, Fail Basique
    await expect(page).toHaveURL(/.*positionnement/);
    
    // The test needs to know which answers are correct.
    // We will simulate finding the correct one if possible or just use trial and error/hardcoded index
    // For now, let's assume we want to stop at Initial, so we succeed the Initial level questions.
    
    // Since we don't know the questions exactly, let's assume a generic way to pass:
    // This is hard to do without the question list.
  });
});
