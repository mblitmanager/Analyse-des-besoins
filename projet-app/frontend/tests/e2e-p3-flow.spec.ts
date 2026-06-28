import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:3001/api";

// Helper to fetch formations from the API
async function fetchFormations() {
  try {
    const res = await fetch(`${API_BASE_URL}/formations`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.filter((f: any) => f.isActive);
  } catch (err) {
    console.error("Failed to fetch formations from backend:", err);
    return [
      { id: 44, slug: "word", label: "Word" },
      { id: 43, slug: "excel", label: "Excel" },
      { id: 10, slug: "toeic", label: "Anglais" },
      { id: 22, slug: "wordpress", label: "WordPress" }
    ];
  }
}

test.describe("E2E Dynamic Formations Flow to P3", () => {
  let formations: any[] = [];

  test.beforeAll(async () => {
    formations = await fetchFormations();
    console.log(`Loaded ${formations.length} active formations for E2E tests.`);
  });

  const targetFormations = ["word", "excel", "toeic", "wordpress"];

  for (const slug of targetFormations) {
    test(`Flow for ${slug.toUpperCase()} up to P3`, async ({ page }) => {
      // Find current formation details
      const currentFormation = formations.find(f => f.slug === slug) || { slug, label: slug };
      console.log(`Starting E2E flow for: ${currentFormation.label}`);

      // Fetch all levels and questions for this formation (using public endpoints)
      let allQuizQuestions: any[] = [];
      try {
        const levelsRes = await fetch(`${API_BASE_URL}/formations/${slug}/levels`);
        if (levelsRes.ok) {
          const levels = await levelsRes.json();
          for (const lvl of levels) {
            const qRes = await fetch(`${API_BASE_URL}/questions/positionnement?formation=${slug}&niveau=${lvl.label}`);
            if (qRes.ok) {
              const lvlQuestions = await qRes.json();
              allQuizQuestions.push(...lvlQuestions);
            }
          }
        }
        console.log(`Pre-loaded ${allQuizQuestions.length} questions for ${slug.toUpperCase()}`);
      } catch (err) {
        console.error(`Failed to pre-load questions for ${slug}:`, err);
      }

      // 1. Go to homepage
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h2")).toContainText(/identification/i);

      // 2. Fill User Profile
      await page.getByRole("textbox", { name: "Nom", exact: true }).fill("TestE2E");
      await page.getByRole("textbox", { name: "Prénom", exact: true }).fill(slug.toUpperCase());
      await page.getByRole("textbox", { name: "Téléphone", exact: true }).fill("0612345678");
      await page.getByRole("button", { name: /démarrer le parcours/i }).click();

      // 3. Prerequis Page
      await page.waitForURL("**/prerequis");
      const metierInput = page.locator("input.Wizi-input");
      await metierInput.waitFor({ state: "visible", timeout: 10000 });

      // Fill metier & select situation
      await metierInput.fill("Assistant E2E");
      
      // Select first situation card
      const situationCards = await page.locator(".formation-card").all();
      if (situationCards.length > 0) {
        await situationCards[0].click();
      }

      // Answer prerequisite questions on screen
      const optionCards = await page.locator(".option-card").all();
      const answeredGroups = new Set<string>();
      for (const card of optionCards) {
        const nameAttr = await card.locator("input").getAttribute("name");
        if (nameAttr && !answeredGroups.has(nameAttr)) {
          await card.click();
          answeredGroups.add(nameAttr);
        }
      }

      // Submit prerequisites
      await page.getByRole("button", { name: /valider mon profil/i }).click();

      // 4. Formation Selection
      await page.waitForURL("**/formations");
      await page.waitForLoadState("networkidle");
      
      // Click target formation card
      const formCard = page.locator(".formation-card").filter({ hasText: new RegExp(currentFormation.label, "i") }).first();
      await formCard.click();
      
      // Continue to quiz
      await page.getByRole("button", { name: /continuer/i }).click();

      // 5. Positionnement Quiz Page
      await page.waitForURL("**/positionnement");

      // Adaptive quiz loop
      let quizFinished = false;
      let loopCount = 0;
      while (!quizFinished && loopCount < 10) {
        loopCount++;
        await page.waitForTimeout(1000);

        // Check if we reached the results section inside PositionnementView
        const resultsTitle = page.locator("h1", { hasText: /félicitations/i });
        if (await resultsTitle.isVisible()) {
          console.log("Reached results page within quiz!");
          quizFinished = true;
          break;
        }

        // Locate all visible question headers
        const headers = await page.locator("h3.heading-primary").all();
        if (headers.length === 0) {
          const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
          if (await nextBtn.isVisible()) {
            await nextBtn.click();
            continue;
          }
          break;
        }

        console.log(`Answering ${headers.length} questions on this screen...`);
        for (const header of headers) {
          const qText = (await header.innerText()).trim();
          const cleanQText = qText.replace(/\s+/g, " ");

          // Find match in our pre-loaded questions list
          const matchingQ = allQuizQuestions.find(
            q => q.text.replace(/\s+/g, " ").trim() === cleanQText
          );

          const parentCard = page.locator("div.bg-white", { has: header }).first();

          if (matchingQ) {
            if (matchingQ.responseType === "text") {
              await parentCard.locator("textarea").fill("Réponse E2E automatique");
            } else if (matchingQ.responseType === "checkbox" || matchingQ.metadata?.type === "multi_select") {
              const correctIndices = matchingQ.correctResponseIndexes || [matchingQ.correctResponseIndex];
              for (const idx of correctIndices) {
                if (idx !== -1 && idx < matchingQ.options.length) {
                  const optText = matchingQ.options[idx];
                  await parentCard.locator(".option-card", { hasText: optText }).first().click();
                }
              }
            } else { // radio/qcm
              const idx = matchingQ.correctResponseIndex;
              if (idx !== -1 && idx < matchingQ.options.length) {
                const optText = matchingQ.options[idx];
                await parentCard.locator(".option-card", { hasText: optText }).first().click();
              } else {
                await parentCard.locator(".option-card").first().click();
              }
            }
          } else {
            console.warn(`No match found in DB for question: "${qText}". Selecting fallback.`);
            const firstOpt = parentCard.locator(".option-card").first();
            if (await firstOpt.isVisible()) {
              await firstOpt.click();
            }
          }
        }

        const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
        } else {
          break;
        }
      }

      // 6. Results Screen
      await page.waitForTimeout(1000);
      const resultsBtn = page.getByRole("button", { name: /continuer/i });
      if (await resultsBtn.isVisible()) {
        await resultsBtn.click();
      }

      // 7. Validation Screen
      await page.waitForURL("**/validation");
      await expect(page.locator("h2")).toContainText(/bilan/i);

      // Save initial validation
      await page.getByRole("button", { name: /valider ce parcours/i }).click();

      // Check if P3 card is visible
      const p3ConfirmBtn = page.getByRole("button", { name: /oui, avec plaisir/i });
      if (await p3ConfirmBtn.isVisible()) {
        console.log("P3 card found. Transitioning to P3 mode...");
        await p3ConfirmBtn.click();

        // 8. Select 3rd formation in P3 mode
        await page.waitForURL("**/formations");
        await expect(page.locator("h1")).toContainText(/3ème/i);

        // Find available formation card different from the current one
        const p3Cards = await page.locator(".formation-card").all();
        let selectedP3 = false;
        for (const card of p3Cards) {
          const cardText = await card.innerText();
          if (!cardText.toLowerCase().includes(currentFormation.label.toLowerCase())) {
            await card.click();
            selectedP3 = true;
            break;
          }
        }

        if (!selectedP3 && p3Cards.length > 0) {
          await p3Cards[0].click();
        }

        await page.getByRole("button", { name: /continuer/i }).click();

        // 9. Answer P3 positionnement questions (if not skipped)
        await page.waitForTimeout(1500);
        if (page.url().includes("positionnement")) {
          console.log("P3 positionnement quiz active. Answering...");
          let p3Loop = 0;
          while (page.url().includes("positionnement") && p3Loop < 5) {
            p3Loop++;
            const headers = await page.locator("h3.heading-primary").all();
            for (const header of headers) {
              const parent = page.locator("div.bg-white", { has: header }).first();
              const opt = parent.locator(".option-card").first();
              if (await opt.isVisible()) await opt.click();
            }
            const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
            if (await nextBtn.isVisible()) await nextBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // Wait for final results of P3
        await page.waitForTimeout(1500);
        const p3ContBtn = page.getByRole("button", { name: /continuer/i });
        if (await p3ContBtn.isVisible()) {
          await p3ContBtn.click();
        }

        // 10. Final validation in P3
        await page.waitForURL("**/validation");
        await page.getByRole("button", { name: /valider ce parcours/i }).click();
      }

      // Wait a moment and take the final screenshot
      await page.waitForTimeout(2000);
      const screenshotPath = `test-results/screenshots/${slug}-final-p3.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved screenshot to: ${screenshotPath}`);
    });
  }
});
