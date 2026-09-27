import { test, expect } from "@playwright/test";
import {
  API_BASE_URL,
  advanceToFinalValidation,
  answerWorkflowStep,
  captureCheckpoint,
  continueButton,
  getAdminToken,
  questionCard,
} from "./e2e-helpers";

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
    test(`Flow for ${slug.toUpperCase()} up to P3`, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      // Find current formation details
      const currentFormation = formations.find(f => f.slug === slug) || { slug, label: slug };
      console.log(`Starting E2E flow for: ${currentFormation.label}`);

      // Answer keys are only served to admins: fetch this formation's positionnement
      // questions through the authenticated admin endpoint.
      let allQuizQuestions: any[] = [];
      try {
        const token = await getAdminToken();
        const qRes = await fetch(`${API_BASE_URL}/questions?formation=${encodeURIComponent(slug)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (qRes.ok) {
          const questions = await qRes.json();
          allQuizQuestions = questions.filter((q: any) => q.type === "positionnement");
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

      // The workflow can include a formation-specific leveling step first.
      await page.waitForURL(/\/(mise-a-niveau|positionnement)$/);
      if (page.url().includes("mise-a-niveau")) {
        await answerWorkflowStep(page);
      }

      // 5. Positionnement Quiz Page
      await page.waitForURL("**/positionnement");

      // Adaptive quiz loop
      let quizFinished = false;
      let loopCount = 0;
      while (!quizFinished && loopCount < 10) {
        loopCount++;
        await page.waitForTimeout(1000);

        // Passing every level opens the "high level" alert: keep the chosen formation.
        const keepFormation = page.getByRole("button", { name: /^Continuer avec / });
        if (await keepFormation.isVisible()) {
          await keepFormation.click();
          continue;
        }

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
          if (!matchingQ) throw new Error(`Question absente des corrigés admin : "${cleanQText}"`);

          const parentCard = questionCard(header);

          if (matchingQ) {
            if (matchingQ.responseType === "text") {
              await parentCard.locator("textarea").fill("Réponse E2E automatique");
            } else if (matchingQ.responseType === "checkbox" || matchingQ.metadata?.type === "multi_select") {
              const correctIndices = matchingQ.correctResponseIndexes || [matchingQ.correctResponseIndex];
              for (const idx of correctIndices) {
                if (idx !== -1 && idx < matchingQ.options.length) {
                  const options = parentCard.locator(".option-card");
                  if (idx < await options.count()) await options.nth(idx).click();
                }
              }
            } else { // radio/qcm
              const idx = matchingQ.correctResponseIndex;
              if (idx !== -1 && idx < matchingQ.options.length) {
                const options = parentCard.locator(".option-card");
                if (idx < await options.count()) {
                  await options.nth(idx).click();
                } else {
                  await parentCard.locator(".option-card").first().click();
                }
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

      // 6. Capture the completed positioning screen
      await expect(page).toHaveURL(/\/positionnement$/);
      await expect(page.getByText("Voici votre parcours de formation recommandé :", { exact: true })).toBeVisible();
      await captureCheckpoint(page, testInfo, `${slug}-01-positionnement-termine`);

      // 7. Capture results, then advance to the final validation
      await page.getByRole("button", { name: "Continuer", exact: true }).click();
      await page.waitForURL("**/resultats");
      await expect(page.getByRole("heading", { name: /^Bravo / })).toBeVisible();
      await captureCheckpoint(page, testInfo, `${slug}-02-resultats`);

      await page.getByRole("button", { name: /valider ce parcours et continuer/i }).click();
      await advanceToFinalValidation(page);
      await expect(page.getByText("Votre parcours est maintenant validé", { exact: true })).toBeVisible();
      await captureCheckpoint(page, testInfo, `${slug}-03-validation-finale`);

      // Check if P3 card is visible
      const p3ConfirmBtn = page.getByRole("button", { name: /oui, avec plaisir/i });
      if (await p3ConfirmBtn.isVisible()) {
        console.log("P3 card found. Transitioning to P3 mode...");
        await p3ConfirmBtn.click();

        // 8. Select 3rd formation in P3 mode
        await page.waitForURL("**/formations");
        await expect(page.locator("h1")).toContainText(/3ème/i);

        // Cards load asynchronously. Pick a formation other than the current one; the
        // generative-AI group only expands sub-choices and keeps "Continuer" disabled.
        const p3Cards = page.locator(".formation-card");
        await p3Cards.first().waitFor({ state: "visible" });
        const p3Choice = p3Cards
          .filter({ hasNotText: new RegExp(currentFormation.label, "i") })
          .filter({ hasNotText: /intelligence artificielle/i })
          .first();
        await p3Choice.click();

        // The inline button is duplicated by a sticky bar once scrolled.
        const p3Continue = continueButton(page).first();
        await expect(p3Continue).toBeEnabled();
        await p3Continue.click();

        // 9. Answer P3 positionnement questions (if not skipped)
        await page.waitForURL(/\/(positionnement|resultats)$/);
        if (page.url().includes("positionnement")) {
          console.log("P3 positionnement quiz active. Answering...");
          let p3Loop = 0;
          while (page.url().includes("positionnement") && p3Loop < 60) {
            p3Loop++;
            const headers = await page.locator("h3.heading-primary").all();
            for (const header of headers) {
              const parent = questionCard(header);
              const opt = parent.locator(".option-card").first();
              if (await opt.isVisible()) await opt.click();
            }
            const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
            if (await nextBtn.isVisible()) await nextBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // Capture P3 positioning when the quiz reached its recommendation screen.
        if (page.url().includes("positionnement")) {
          await expect(page.getByText("Voici votre parcours de formation recommandé :", { exact: true })).toBeVisible();
          await captureCheckpoint(page, testInfo, `${slug}-p3-01-positionnement-termine`);
          await page.getByRole("button", { name: "Continuer", exact: true }).click();
          await page.waitForURL("**/resultats");
        }

        // 10. Capture P3 results and final validation
        await expect(page.getByRole("heading", { name: /^Bravo / })).toBeVisible();
        await captureCheckpoint(page, testInfo, `${slug}-p3-02-resultats`);
        await page.getByRole("button", { name: /valider ce parcours et continuer/i }).click();
        await advanceToFinalValidation(page);
        await expect(page.getByText("Votre parcours est maintenant validé", { exact: true })).toBeVisible();
        await captureCheckpoint(page, testInfo, `${slug}-p3-03-validation-finale`);
      }

      await captureCheckpoint(page, testInfo, `${slug}-parcours-final`);
    });
  }
});
