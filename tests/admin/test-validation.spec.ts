import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = 'https://ns-conseil-ab.mbl-service.com';
const LOGIN_URL = `${FRONTEND_URL}/admin/login`;
const VALIDATION_URL = `${FRONTEND_URL}/admin/test-validation`;
const SCREENSHOT_DIR = 'test-results/screenshots/admin/test-validation';

function screenshotName(step: number, label: string) {
  const normalizedLabel = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `${SCREENSHOT_DIR}/${String(step).padStart(2, '0')}-${normalizedLabel}.png`;
}

async function login(page: Page) {
  const email = process.env.V2_ADMIN_EMAIL;
  const password = process.env.V2_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set V2_ADMIN_EMAIL and V2_ADMIN_PASSWORD to run authenticated admin tests.');
  }

  await page.goto(LOGIN_URL);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe('V2 admin test validation', () => {
  test('redirects unauthenticated users to admin login', async ({ page }) => {
    await page.goto(VALIDATION_URL);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-login-required.png`, fullPage: true });
  });

  test('audits every validation scenario one by one', async ({ page }) => {
    test.skip(
      !process.env.V2_ADMIN_EMAIL || !process.env.V2_ADMIN_PASSWORD,
      'Set V2_ADMIN_EMAIL and V2_ADMIN_PASSWORD to run authenticated admin tests.',
    );

    await login(page);
    await page.goto(VALIDATION_URL);
    await expect(page.getByRole('heading', { name: 'Cahier de Recette Automate' })).toBeVisible();

    await page.evaluate(() => localStorage.removeItem('test_validation_results'));
    await page.reload();

    const rows = page.locator('tbody tr');
    const total = await rows.count();
    expect(total).toBeGreaterThan(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-initial-state.png`, fullPage: true });

    for (let index = 0; index < total; index += 1) {
      const row = rows.nth(index);
      const label = (await row.locator('td').first().innerText()).trim();
      await row.getByRole('button').click();

      const completed = index + 1;
      await expect(page.getByText(`${completed} / ${total} Scénarios Audités`, { exact: true })).toBeVisible();
      await expect(row.locator('span.material-icons-outlined')).toHaveText('check_circle');
      await page.screenshot({ path: screenshotName(index + 2, label), fullPage: true });
    }

    await expect(page.getByText(`${total} / ${total} Scénarios Audités`, { exact: true })).toBeVisible();
  });
});