import { test, expect } from "@playwright/test";

/**
 * Formation: gimp | Level: p1 | Parcours: 1
 */

test("gimp - p1 - Parcours 1", async ({ page, context }) => {
  // Navigate to formations
  await page.goto("/formations");
  await page.waitForLoadState("networkidle");
  
  // Select formation
  const formationSelector = page.locator("*:has-text(\"GIMP\")").first();
  if (await formationSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
    await formationSelector.click();
    await page.waitForLoadState("networkidle");
  }
  
  // Start session - click Commencer
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
  
  // Complete positionnement
  let questionCount = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const radios = await page.locator("input[type=\"radio\"]").all();
    if (radios.length === 0) {
      console.log("Positionnement complete after " + questionCount + " questions");
      break;
    }
    
    await radios[0].check({ force: true });
    questionCount++;
    await page.waitForTimeout(150);
    
    // Click Suivant
    const buttons = await page.locator("button").all();
    let suivantClicked = false;
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("suivant")) {
        await btn.click();
        await page.waitForLoadState("networkidle");
        suivantClicked = true;
        break;
      }
    }
    
    if (!suivantClicked) {
      console.log("No Suivant button after " + questionCount + " questions");
      break;
    }
  }
  
  // Wait and screenshot positionnement end
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "./test-results/screenshots/gimp-p1-parcours-1-01-positionnement-end.png",
    fullPage: true
  });
  
  // Click Terminer to go to results
  await page.waitForTimeout(500);
  let terminerClicked = false;
  for (let i = 0; i < 3; i++) {
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes("terminer") || text?.toLowerCase().includes("résultat") || text?.toLowerCase().includes("finish")) {
        await btn.click();
        await page.waitForLoadState("networkidle");
        terminerClicked = true;
        break;
      }
    }
    if (terminerClicked) break;
    await page.waitForTimeout(300);
  }
  
  // Wait for results page
  await page.waitForTimeout(2000);
  
  // Screenshot results
  await page.screenshot({
    path: "./test-results/screenshots/gimp-p1-parcours-1-02-results.png",
    fullPage: true
  });
  
  console.log("Done: gimp p1 parcours 1");
});

export {};
