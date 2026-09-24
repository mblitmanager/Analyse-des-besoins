import { test, expect } from '@playwright/test';

test('Diagnostic - Form submission with error capture', async ({ page }) => {
  const errors: string[] = [];
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  
  // Listen for page crashes
  page.on('crash', () => {
    console.log('PAGE CRASHED');
  });
  
  console.log('Step 1: Navigate to home');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  
  console.log('Step 2: Fill form');
  
  // Click civilité
  const civiliteRadio = page.locator('input[name="civilite"][value="M."]');
  await civiliteRadio.click();
  await page.waitForTimeout(300);
  
  // Fill fields
  await page.locator('input[id="last-name"]').fill('Dupont');
  await page.locator('input[id="first-name"]').fill('Jean');
  await page.locator('input[name="phone"]').fill('0612345678');
  
  console.log('Step 3: Intercept API call');
  const responseProm = page.waitForResponse(r => r.url().includes('/api/sessions'));
  
  console.log('Step 4: Submit form');
  await page.locator('button[type="submit"]').click();
  
  try {
    const response = await responseProm.catch(() => null);
    if (response) {
      const data = await response.json().catch(() => null);
      console.log('API Response:', response.status(), data?.id ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('No API response received');
    }
  } catch (e) {
    console.log('Error capturing response:', e);
  }
  
  // Wait a bit and check URL
  await page.waitForTimeout(2000);
  console.log(`URL after submit: ${page.url()}`);
  
  if (errors.length > 0) {
    console.log('Errors encountered:', errors);
  }
});
