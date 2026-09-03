import { test, expect, Page } from '@playwright/test';

const RUN_REAL_E2E = process.env.RUN_REAL_E2E === '1';

test.describe('E2E navigateur - parcours candidat complet', () => {
  test.skip(!RUN_REAL_E2E, 'Définir RUN_REAL_E2E=1 pour utiliser une API et une base E2E dédiées.');

  test('va de l’identification à la validation finale', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/identification/i);

    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('E2E');
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill(`Candidate-${Date.now()}`);
    await page.getByRole('textbox', { name: 'Téléphone', exact: true }).fill('0600000000');
    await page.getByRole('button', { name: /démarrer le parcours/i }).click();

    await page.waitForURL('**/prerequis');
    const profession = page.locator('input.Wizi-input').first();
    if (await profession.isVisible()) await profession.fill('Test automatisé');

    const situation = page.locator('.formation-card').first();
    if (await situation.isVisible()) await situation.click();
    await answerVisibleQuestions(page);

    const profileButton = page.getByRole('button', { name: /valider mon profil/i });
    if (await profileButton.isVisible()) await profileButton.click();

    await page.waitForURL('**/formations');
    const formationCard = page.locator('.formation-card').first();
    await expect(formationCard).toBeVisible();
    await formationCard.click();
    await page.getByRole('button', { name: /continuer/i }).click();

    // Depending on active workflow settings, intermediate steps may be skipped.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (page.url().includes('/validation')) break;
      await answerVisibleQuestions(page);
      const next = page.getByRole('button', { name: /suivant|terminer|continuer/i }).first();
      if (await next.isVisible()) {
        await next.click();
      } else {
        await page.waitForTimeout(250);
      }
    }

    if (page.url().includes('/resultats')) {
      const continueButton = page.getByRole('button', { name: /continuer/i }).first();
      if (await continueButton.isVisible()) await continueButton.click();
    }

    await page.waitForURL('**/validation');
    await expect(page.locator('body')).toContainText(/bilan|validation/i);
    const validateButton = page.getByRole('button', { name: /valider ce parcours/i });
    await expect(validateButton).toBeVisible();
    await validateButton.click();

    // The business flow may offer a P3 continuation or finish directly.
    await expect(page.locator('body')).toContainText(/merci|terminé|3.?ème|parcours/i);
  });
});

async function answerVisibleQuestions(page: Page) {
  const cards = page.locator('.option-card:visible');
  const count = await cards.count();
  const selectedGroups = new Set<string>();

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const input = card.locator('input').first();
    const group = await input.getAttribute('name').catch(() => null);
    if (group && selectedGroups.has(group)) continue;
    await card.click();
    if (group) selectedGroups.add(group);
  }

  const textareas = page.locator('textarea:visible');
  for (let i = 0; i < await textareas.count(); i += 1) {
    await textareas.nth(i).fill('Réponse E2E');
  }
}
