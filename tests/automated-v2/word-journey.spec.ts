import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'https://ns-conseil-ab.mbl-service.com';
const SCREENSHOT_DIR = 'test-results/screenshots/automated-v2/word';

async function capture(page: Page, step: string) {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${step}.png`,
    fullPage: true,
  });
}

test('V2 - parcours automatisé Word jusqu’aux résultats', async ({ page }) => {
  await page.goto(`${FRONTEND_URL}/`);
  await page.waitForLoadState('networkidle');
  await capture(page, '01-identification');

  await page.locator('input[name="civilite"][value="M."]').check();
  await page.locator('#last-name').fill('Test Automatique');
  await page.locator('#first-name').fill('Word');
  await page.locator('input[name="phone"]').fill('0612345678');
  await page.getByRole('button', { name: 'Démarrer le parcours' }).click();
  await expect(page).toHaveURL(/\/prerequis$/);
  await capture(page, '02-prerequis');

  await page.locator('input[placeholder*="Assistant administratif"]').fill('Testeur QA');
  await page.locator('label').filter({ hasText: /Salarié/ }).first().click();
  await page.getByText('Quotidiennement').first().click();
  await page.locator('label').filter({ hasText: 'Oui avec quelques difficultés' }).first().click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(2).click();
  await page.getByText('Occasionnellement').nth(1).click();
  await page.locator('label').filter({ hasText: 'Oui' }).nth(4).click();
  await page.getByText('Non').nth(3).click();
  await page.getByText('Occasionnellement').nth(2).click();
  await page.getByRole('button', { name: 'Valider mon profil' }).click();
  await expect(page).toHaveURL(/\/formations$/);
  await capture(page, '03-selection-formation');

  await page.getByRole('button', { name: /description Word/ }).click();
  await page.getByRole('button', { name: /^Continuer/ }).last().click();
  await expect(page).toHaveURL(/\/positionnement$/);
  await capture(page, '04-positionnement-debut');

  for (let question = 1; question <= 60; question += 1) {
    const options = page.locator('label.option-card:visible');
    const textAnswer = page.locator('textarea:visible');
    if (await options.count()) {
      await options.first().click();
      await expect(options.first()).toHaveClass(/option-card--selected/);
    } else {
      await expect(textAnswer.first()).toBeVisible({ timeout: 10000 });
      await textAnswer.first().fill('Réponse automatisée');
    }

    const next = page
      .locator('button:not([disabled])')
      .filter({ hasText: /Question Suivante|Suivant|Terminer/ })
      .last();
    await expect(next).toBeVisible({ timeout: 5000 });
    await next.click();

    if (await page.getByText('Voici votre parcours de formation recommandé').isVisible().catch(() => false)) {
      break;
    }
  }

  await expect(page.getByText('Voici votre parcours de formation recommandé')).toBeVisible({ timeout: 15000 });
  await capture(page, '05-resultats');
});