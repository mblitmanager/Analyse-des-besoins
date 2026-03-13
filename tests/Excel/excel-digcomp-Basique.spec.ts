import { test, expect } from '@playwright/test';

test('excel + digcomp basique', async ({ page }) => {
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
  await page.getByRole("button", { name: "Continuer arrow_forward" }).nth(0).click();
  await page.getByText("Une cellule").click();
  await page.getByText("=SOMME()").click();
  await page.getByText("Graphique Camembert (Secteur)").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "L'icône : $" }).click();
  await page
    .locator("label")
    .filter({ hasText: "A ordonner les valeurs en" })
    .click();
  await page.getByText("SI()").click();
  await page.locator("label").filter({ hasText: "Figer les volets" }).click();
  await page.locator("label").filter({ hasText: "AUJOURDHUI()" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("À mettre en évidence les").click();
  await page
    .locator("label")
    .filter({ hasText: "De copier et/ou incrémenter" })
    .click();
  await page.getByText("Un tableau croisé dynamique").click();
  await page.getByText("Données", { exact: true }).click();
  await page.getByText("Je protège le classeur").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("Utiliser la fonction SOMMEPROD").click();
  await page
    .locator("label")
    .filter({ hasText: "Utiliser un graphique combiné" })
    .click();
  await page.getByText("À concaténer des valeurs").click();
  await page.getByText("À tester les valeurs é").click();
  await page.getByText("modèle de données").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Excel-DigComp-Basique.png', fullPage: true });
  await page.getByRole('button', { name: 'Continuer avec Excel' }).click();
  //time out + screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Excel-DigComp-Basique2.png', fullPage: true });
 
});