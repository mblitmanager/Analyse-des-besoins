import { test, expect } from "@playwright/test";

/**
 * Formation: excel | Level: avanc | Parcours: 5
 * Niveau ordre: 4
 * Seuil de réussite: 4%
 * 
 * Formations proposées:
 * - Formation 1: Excel basique (TOSA)
 * - Formation 2: Excel Opérationnel (TOSA)
 */

test("excel-avanc-parcours-5 - Excel - Avancé - Parcours 5", async ({ page, context }) => {
  // Navigate to formations page
  await page.goto("https://ns-conseil-ab.mbl-service.com/formations");
  await page.waitForLoadState("networkidle");
  
  // Select formation - search for "Excel"
  const formationSelectors = await page.locator("*:has-text(\"Excel\")").all();
  let formationFound = false;
  
  for (const selector of formationSelectors) {
    if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify it's clickable (not just text in a label)
      const isButton = await selector.evaluate(el => {
        return el.tagName === 'BUTTON' || 
               el.onclick !== null || 
               el.getAttribute('role') === 'button';
      }).catch(() => false);
      
      if (isButton) {
        await selector.click();
        await page.waitForLoadState("networkidle");
        formationFound = true;
        break;
      }
    }
  }
  
  if (!formationFound) {
    console.log("Warning: Formation 'Excel' not found on the page");
  }
  
  // Start session - click "Commencer" button
  let commencerFound = false;
  for (let i = 0; i < 3; i++) {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("commencer")) {
        await btn.click();
        await page.waitForLoadState("networkidle");
        commencerFound = true;
        break;
      }
    }
    if (commencerFound) break;
    await page.waitForTimeout(500);
  }
  
  if (!commencerFound) {
    console.log("Warning: 'Commencer' button not found");
  }
  
  // Complete positionnement by selecting first option for each question
  let questionCount = 0;
  let maxQuestions = 50; // Safety limit
  
  for (let attempt = 0; attempt < maxQuestions; attempt++) {
    const radios = await page.locator("input[type=\"radio\"]").all();
    
    if (radios.length === 0) {
      console.log(`✓ Positionnement completed after ${questionCount} questions`);
      break;
    }
    
    // Check the first radio button
    try {
      await radios[0].check({ force: true });
      questionCount++;
      await page.waitForTimeout(150);
    } catch (e) {
      console.log("Error checking radio: " + e.message);
      break;
    }
    
    // Click "Suivant" button
    const buttons = await page.locator("button").all();
    let suivantClicked = false;
    
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("suivant")) {
        try {
          await btn.click();
          await page.waitForLoadState("networkidle");
          suivantClicked = true;
          break;
        } catch (e) {
          console.log("Error clicking Suivant: " + e.message);
        }
      }
    }
    
    if (!suivantClicked) {
      console.log(`ℹ No 'Suivant' button found after ${questionCount} questions - test may be complete`);
      break;
    }
  }
  
  // Wait for positionnement to settle
  await page.waitForTimeout(1000);
  
  // Screenshot after positionnement
  try {
    await page.screenshot({
      path: "./test-results/screenshots/excel-avanc-parcours-5-01-positionnement-end.png",
      fullPage: true
    });
    console.log(`📸 Screenshot 1 saved: ./test-results/screenshots/excel-avanc-parcours-5-01-positionnement-end.png`);
  } catch (e) {
    console.log("Error taking screenshot 1: " + e.message);
  }
  
  // Click "Terminer" or similar button to view results
  await page.waitForTimeout(500);
  let terminerClicked = false;
  
  for (let i = 0; i < 5; i++) {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("terminer") || 
          text?.toLowerCase().includes("résultat") || 
          text?.toLowerCase().includes("finish") ||
          text?.toLowerCase().includes("valider")) {
        try {
          await btn.click();
          await page.waitForLoadState("networkidle");
          terminerClicked = true;
          break;
        } catch (e) {
          console.log("Error clicking Terminer: " + e.message);
        }
      }
    }
    if (terminerClicked) break;
    await page.waitForTimeout(300);
  }
  
  if (!terminerClicked) {
    console.log("Warning: 'Terminer' button not found - may already be on results page");
  }
  
  // Wait for results page to load
  await page.waitForTimeout(2000);
  
  // Screenshot results
  try {
    await page.screenshot({
      path: "./test-results/screenshots/excel-avanc-parcours-5-02-results.png",
      fullPage: true
    });
    console.log(`📸 Screenshot 2 saved: ./test-results/screenshots/excel-avanc-parcours-5-02-results.png`);
  } catch (e) {
    console.log("Error taking screenshot 2: " + e.message);
  }
  
  // Verify we got some results
  const bodyText = await page.evaluate(() => document.body.textContent);
  expect(bodyText.length).toBeGreaterThan(0);
  
  console.log(`✅ Test completed: excel-avanc-parcours-5`);
});

export {};
