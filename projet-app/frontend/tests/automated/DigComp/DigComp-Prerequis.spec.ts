import { test, expect } from '@playwright/test';

test('DigComp-Prerequis', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('DigComp');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('OK');
  await page.getByRole('textbox', { name: 'Prénom' }).press('Tab');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06 06 06 06');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('DigComp');
  await page.getByText('Reconversion').click();
  await page.getByText('Jamais').first().click();
  await page.getByText('Non').first().click();
  await page.getByText('Non').nth(1).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(1).click();
  await page.locator('label').filter({ hasText: 'Non' }).nth(2).click();
  await page.getByText('Non').nth(3).click();
  await page.locator('label').filter({ hasText: 'Jamais' }).nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: 'Accepter et voir mon bilan' }).click();
  // await page.getByRole('button', { name: 'Valider ce parcours et' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "DigComp-Prerequis.png", fullPage: true });
  //continuer + screenshot
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "DigComp-Prerequis2.png", fullPage: true });
  
});