import { test, expect } from '@playwright/test';

test('Anglais-Prerequis-KO', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Anglais');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).press('Tab');
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Prerequis-KO');
  await page.getByRole('textbox', { name: 'Téléphone' }).click();
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('06 06 06 06');
  await page.getByRole('textbox', { name: 'Conseiller commercial (' }).click();
  await page.getByRole('textbox', { name: 'Conseiller commercial (' }).fill('AF');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).click();
  await page.getByRole('textbox', { name: 'Ex: Assistant administratif,' }).fill('Toeic - Prerequis KO');
  await page.locator('label').filter({ hasText: 'person_outlineSalarié' }).click();
  await page.locator('div:nth-child(3) > .flex.items-center.w-full > .formation-card__radio').click();
  await page.getByText('Occasionnellement').first().click();
  await page.locator('label').filter({ hasText: 'Non' }).first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).nth(1).click();
  await page.locator('label').filter({ hasText: 'Occasionnellement' }).nth(1).click();
  await page.locator('span').filter({ hasText: /^Oui avec quelques difficultés$/ }).click();
  await page.getByText('Non').nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await page.getByRole('button', { name: 'Ignorer et continuer' }).click();
  await page.getByRole('button', { name: 'spellcheck Anglais' }).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).nth(0).click();
  await page.locator('label').filter({ hasText: 'Bac + 2' }).click();
  await page.locator('label').nth(4).click();
  await page.getByText('Collègue', { exact: true }).click();
  await page.getByText('Ponctuel').click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(1).click();
  await page.locator('div:nth-child(6) > .grid > label > .option-card__radio').first().click();
  await page.locator('div:nth-child(6) > .grid > label:nth-child(4) > .option-card__radio').click();
  await page.locator('label').filter({ hasText: 'Régulier' }).nth(1).click();
  await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
   await page.locator('label:has-text("is")').first().click(); //non séléctionné
  await page
    .locator(
      "div:nth-child(2) > .p-6 > .grid > label:nth-child(2) > .option-card__radio",
    )
    .click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.locator("label").filter({ hasText: "is watching" }).click();
  await page.locator("label").filter({ hasText: "goes" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText('Je ne sais pas').first().click();
  await page.locator('label').filter({ hasText: 'Je ne sais pas' }).nth(1).click();
  await page.getByText('Je ne sais pas').nth(2).click();
  await page.getByText('Je ne sais pas').nth(3).click();
  await page.locator('label').filter({ hasText: 'Je ne sais pas' }).nth(4).click();
  await page.getByText('Je ne sais pas').nth(5).click();
  await page.getByRole('button', { name: 'Suivant arrow_forward' }).click();
  // await page.getByRole('button', { name: 'Continuer' }).click();
  // await page.getByRole('button', { name: 'Valider ce parcours et' }).click();
  // await page.getByRole('combobox').selectOption('Je souhaite obtenir une certification pour améliorer mes chances de retrouver un emploi');
  // await page.getByText('Non').first().click();
  // await page.locator('label').first().click();
  // await page.locator('label').nth(2).click();
  // await page.getByRole('button', { name: 'Continuer arrow_forward' }).click();
  // await page.getByText('wb_twilightAprès-midi').click();
  // await page.getByRole('button', { name: 'Valider mes disponibilités' }).click();
  //time out + screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Anglais-Prerequis-KO.png', fullPage: true });
  // continuer + screenshot
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'Anglais-Prerequis-KO-2.png', fullPage: true });
});