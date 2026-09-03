import { test, expect } from '@playwright/test';

test.describe('Capture état actuel application', () => {
  test('Capture écran de l\'état actuel', async ({ page }) => {
    // Accéder à l'application
    await page.goto('http://localhost:5173/');
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    
    // Prendre une capture d'écran de l'état actuel
    await page.screenshot({ 
      path: 'etat-actuel-application.png',
      fullPage: true 
    });
    
    console.log('✅ Capture d\'écran prise: etat-actuel-application.png');
  });
});
