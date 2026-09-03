import { test, expect } from '@playwright/test';

test.describe('Capture écran - Règles P3 Override', () => {
  test('Capture écran règle Expertise Anglais', async ({ page }) => {
    // Accéder à l'interface admin
    await page.goto('http://localhost:5174/admin/login');
    
    // Se connecter (adapter selon vos identifiants)
    await page.fill('input[type="email"], input[name="email"]', 'herizo@wizi-learn.com');
    await page.fill('input[type="password"], input[name="password"]', 'votre_mot_de_passe');
    await page.click('button[type="submit"]');
    
    // Attendre la redirection
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Naviguer vers les règles P3 override
    await page.goto('http://localhost:5174/admin/p3-override');
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    
    // Chercher la règle Expertise Anglais
    const expertiseAnglais = page.locator('text=Expertise Anglais').first();
    
    if (await expertiseAnglais.isVisible()) {
      // Faire défiler jusqu'à l'élément
      await expertiseAnglais.scrollIntoViewIfNeeded();
      
      // Prendre une capture d'écran
      await page.screenshot({ 
        path: 'expertise-anglais-p3-rule.png',
        fullPage: false 
      });
      
      console.log('✅ Capture d\'écran prise: expertise-anglais-p3-rule.png');
    } else {
      // Prendre une capture d'écran de toute la page
      await page.screenshot({ 
        path: 'p3-override-page.png',
        fullPage: true 
      });
      
      console.log('⚠️ Règle Expertise Anglais non trouvée, capture de la page prise');
    }
  });
});
