import { test, expect } from '@playwright/test';

test('excel + digcomp', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Excel');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Digcomp');
  await page.getByRole('textbox', { name: 'Téléphone' }).click();
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('0');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Excel + DigComp');
  await page.locator('div').filter({ hasText: /^person_outlineIndépendant$/ }).first().click();
  await page.getByText('person_outlineReconversion').click();
  await page.getByText('Jamais').first().click();
  await page.getByText('Oui avec quelques difficultés').first().click();
  await page.getByText('Non').nth(1).click();
  await page.getByText('4A quelle fréquence utilisez-vous internet ?Quotidiennement Occasionnellement').click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.getByText('Non').nth(3).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: 'Ignorer et continuer' }).click();
  await page.getByRole('button', { name: 'description Excel' }).click();
  await page.getByText('ContinuerContinuerarrow_forward').click();
  await page.getByText('Une cellule').click();
  await page.locator('span').filter({ hasText: '=SOMME()' }).click();
  await page.getByText('Camembert (Secteur)').click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.getByText('L\'icône : £').click();
  await page.getByText('A ordonner les valeurs en').click();
  await page.getByText('NB()').click();
  await page.getByText('conditionnelle').click();
  await page.getByText('AUJOURDHUI()').click();
  //time out + screenshot
  
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Excel-DigComp.png', fullPage: true });
  await page.getByRole('button', { name: 'Continuer avec Excel' }).click();
  //time out + screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Excel-DigComp2.png', fullPage: true });
 
});