import { test } from '@playwright/test';

// Diagnostic: list all visible formation titles and clickable elements to locate "IA Générative"
test('List formations and clickable elements (diagnostic)', async ({ page }) => {
  const base = process.env.BASE_URL || 'http://localhost:5173';
  await page.goto(`${base}/formations`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Handle identification overlay if present (same logic as modal test)
  const needsIdentification = await page.locator('text=Veuillez renseigner vos informations').isVisible().catch(() => false);
  if (needsIdentification) {
    const textInputs = page.locator('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]) , textarea');
    const textCount = await textInputs.count();
    if (textCount >= 1) await textInputs.nth(0).fill('Test');
    if (textCount >= 2) await textInputs.nth(1).fill('User');
    if (textCount >= 3) await textInputs.nth(2).fill('0600000000');
  if (textCount >= 4) await textInputs.nth(3).fill('test@example.com');
  // Select first option for any select elements
  const selects = page.locator('select');
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const options = await selects.nth(i).locator('option');
    if ((await options.count()) > 0) {
      const val = await options.nth(0).getAttribute('value');
      await selects.nth(i).selectOption(val).catch(() => {});
    }
  }
  // Check any checkboxes
  const checkboxes = page.locator('input[type="checkbox"]');
  const cbCount = await checkboxes.count();
  for (let i = 0; i < cbCount; i++) {
    if (!(await checkboxes.nth(i).isChecked().catch(() => false))) {
      await checkboxes.nth(i).check().catch(() => {});
    }
  }
  // Try to select a civilite if present
  const civiliteRadio = page.locator('input[type="radio"][name="civilite"]').first();
  if (await civiliteRadio.isVisible().catch(() => false)) {
    await civiliteRadio.check().catch(() => {});
  }
  // Click start button if present, else submit the form element
  const startBtn = page.getByText(/DÉMARRER LE PARCOURS|DÉMARRER/).first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  } else {
    // try to submit the first form on the page
    await page.evaluate(() => {
      const f = document.querySelector('form');
      if (f) (f as HTMLFormElement).submit();
    }).catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }
  }

  // Take a full page screenshot for visual inspection
  await page.screenshot({ path: 'test-results/screenshots/diagnostic-01-formations-full.png', fullPage: true });

  // Collect formation-like elements by common selectors
  const results = await page.evaluate(() => {
    const candidates = [];
    const selectors = [
      '.formation-card', '.formation', '.card', '.course', '.formation-title',
      'h1', 'h2', 'h3', 'a', 'button', '[role="link"]', '[role="button"]'
    ];
    const seen = new Set();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach((el) => {
        const text = el.innerText ? el.innerText.trim().replace(/\s+/g, ' ') : '';
        if (text && !seen.has(text) && text.length < 300) {
          seen.add(text);
          candidates.push({ selector: sel, text: text, tag: el.tagName.toLowerCase(), href: el.getAttribute('href') || null, dataset: {...el.dataset} });
        }
      });
    });
    // Also search for any element containing 'IA' or 'IA Générative' in text
    const matches = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.innerText && /IA Générative|IA GENERATIVE|IA|Générative/i.test(el.innerText)) {
        const text = el.innerText.trim().replace(/\s+/g, ' ');
        if (!seen.has(text)) { seen.add(text); matches.push({ text, tag: el.tagName.toLowerCase(), selector: el.outerHTML.substring(0,200) }); }
      }
    });
    return { candidates, matches };
  });

  console.log('--- Diagnostic: formation-like candidates (count) ---');
  console.log(results.candidates.length);
  results.candidates.slice(0,50).forEach((c, i) => console.log(`[${i}] (${c.tag}) ${c.selector} -> ${c.text.substring(0,120)}`));

  console.log('--- Diagnostic: elements matching IA terms ---');
  console.log(results.matches.length);
  results.matches.forEach((m, i) => console.log(`[${i}] (${m.tag}) ${m.text.substring(0,200)} --- snippet: ${m.selector}`));

  // Save the results JSON for inspection
  return results;
});
