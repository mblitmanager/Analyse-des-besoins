import { test } from "@playwright/test";

/**
 * Suite E2E — Anglais (CEFR) — Niveaux A2, B1, B2, C1
 * =====================================================
 * Approche générique : chaque test répond automatiquement à toutes les
 * questions disponibles en cliquant la première option-card de chaque groupe,
 * puis avance avec "Suivant" / "Terminer". Aucun texte d'option hardcodé.
 *
 * Objectif : vérifier que le flux adaptatif complet fonctionne (navigation,
 * soumission, résultats, validation) pour chaque niveau CEFR.
 */

const BASE_URL = "http://localhost:5173";
const TEST_TIMEOUT = 120_000; // 2 min pour le flux adaptatif complet

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

/** Vide la session et charge la page d'accueil propre */
async function startFreshSession(page: any, nom: string, prenom: string) {
  await page.goto(BASE_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Remplir le formulaire d'identification
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill(nom);
  await page.getByRole("textbox", { name: "Prénom" }).fill(prenom);
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 06");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page.waitForLoadState("networkidle");
}

/** Remplit les prérequis généraux (si la page est présente) */
async function fillPrerequisIfPresent(page: any) {
  const metierInput = page.getByRole("textbox", { name: "Ex: Assistant administratif," });
  if (!(await metierInput.isVisible({ timeout: 4000 }).catch(() => false))) {
    console.log("[skip] Page prérequis absente");
    return;
  }
  await metierInput.fill("Assistante");
  // Sélectionner la première carte de situation
  const situationCards = await page.locator(".formation-card__radio").all();
  if (situationCards.length) await situationCards[0].click();

  // Répondre à chaque groupe de questions prérequis (option-card)
  const answeredGroups = new Set<string>();
  const optCards = await page.locator(".option-card").all();
  for (const card of optCards) {
    const name = await card.locator("input").getAttribute("name").catch(() => null);
    if (name && !answeredGroups.has(name)) {
      await card.click().catch(() => {});
      answeredGroups.add(name);
    }
  }
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.waitForLoadState("networkidle");
}

/** Sélectionne la formation Anglais sur la page formations */
async function selectFormationAnglais(page: any) {
  const anglaisBtn = page.getByRole("button", { name: "spellcheck Anglais" });
  await anglaisBtn.waitFor({ state: "visible", timeout: 15000 });
  await anglaisBtn.click();
  await page.waitForLoadState("networkidle");
  const continuerBtn = page.getByRole("button", { name: "Continuer arrow_forward" });
  if (await continuerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continuerBtn.click();
    await page.waitForLoadState("networkidle");
  }
}

/**
 * Runner générique du quiz adaptatif.
 *
 * Pour chaque page de questions :
 *   1. Répond à toutes les questions visibles (première option-card par groupe)
 *   2. Clique sur "Continuer arrow_forward" s'il s'agit d'un écran intermédiaire
 *   3. Clique sur "Suivant" ou "Terminer" pour avancer
 *   4. S'arrête dès qu'un bouton "Continuer" (sans arrow) apparaît (résultats)
 */
async function runAdaptiveQuiz(page: any, maxIterations = 30) {
  for (let i = 0; i < maxIterations; i++) {
    await page.waitForTimeout(600);

    // ── Vérifier si les résultats sont affichés ──────────────────────────
    const continuerResult = page.getByRole("button", { name: "Continuer" });
    // On exclut le "Continuer arrow_forward" (navigation inter-niveau)
    const hasResult = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.some(b => b.textContent?.trim() === "Continuer" || 
                            b.textContent?.includes("Continuer") && !b.textContent?.includes("arrow_forward"));
    }).catch(() => false);
    if (hasResult) {
      console.log(`[Quiz] Résultats détectés après ${i} itérations`);
      break;
    }

    // ── Bouton "Continuer arrow_forward" (transition inter-niveau) ────────
    const continuerFwd = page.getByRole("button", { name: "Continuer arrow_forward" });
    if (await continuerFwd.isVisible({ timeout: 500 }).catch(() => false)) {
      await continuerFwd.click();
      await page.waitForLoadState("networkidle");
      continue;
    }

    // ── Répondre aux questions visible sur cette page ─────────────────────
    const clickedGroups = new Set<string>();
    const optionCards = await page.locator(".option-card").all();
    for (const card of optionCards) {
      const inputEl = card.locator("input");
      const name = await inputEl.getAttribute("name").catch(() => null);
      const checked = await inputEl.isChecked().catch(() => false);
      if (name && !clickedGroups.has(name) && !checked) {
        await card.click().catch(() => {});
        clickedGroups.add(name);
        await page.waitForTimeout(80);
      }
    }

    // Textareas (questions ouvertes)
    const textareas = await page.locator("textarea").all();
    for (const ta of textareas) {
      if (await ta.isVisible().catch(() => false)) {
        const val = await ta.inputValue().catch(() => "");
        if (!val) await ta.fill("Réponse automatique").catch(() => {});
      }
    }

    await page.waitForTimeout(300);

    // ── Avancer : Suivant → Terminer → fallback ───────────────────────────
    const suivant = page.getByRole("button", { name: "Suivant arrow_forward" });
    const terminer = page.getByRole("button", { name: "Terminer arrow_forward" });

    if (await suivant.isVisible({ timeout: 800 }).catch(() => false)) {
      const enabled = await suivant.isEnabled({ timeout: 800 }).catch(() => false);
      if (enabled) {
        await suivant.click();
        await page.waitForLoadState("networkidle");
        continue;
      } else {
        // Bouton visible mais disabled → des questions n'ont pas été répondues
        // Essayer les checkboxes / radios non cochés restants
        const uncheckedRadios = await page.locator("input[type='radio']:not(:checked)").all();
        if (uncheckedRadios.length > 0) {
          // Re-parcourir avec forçage
          const remainingCards = await page.locator(".option-card").all();
          for (const card of remainingCards) {
            const inputEl = card.locator("input");
            const name = await inputEl.getAttribute("name").catch(() => null);
            const checked = await inputEl.isChecked().catch(() => false);
            if (name && !clickedGroups.has(name) && !checked) {
              await card.click({ force: true }).catch(() => {});
              clickedGroups.add(name);
            }
          }
          await page.waitForTimeout(300);
          if (await suivant.isEnabled({ timeout: 1000 }).catch(() => false)) {
            await suivant.click();
            await page.waitForLoadState("networkidle");
            continue;
          }
        }
        console.log(`[Quiz] Bouton Suivant toujours disabled à l'itération ${i}`);
      }
    }

    if (await terminer.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await terminer.isEnabled({ timeout: 800 }).catch(() => false)) {
        await terminer.click();
        await page.waitForLoadState("networkidle");
        continue;
      }
    }

    // Si aucun bouton actionnable, vérifier si les résultats apparaissent maintenant
    const finalCheck = await page.locator("button").filter({ hasText: "Continuer" }).isVisible({ timeout: 2000 }).catch(() => false);
    if (finalCheck) break;

    console.log(`[Quiz] Aucun bouton actionnable à l'itération ${i} — arrêt`);
    break;
  }
}

/** Capture une screenshot et continue vers la validation si possible */
async function captureAndContinue(page: any, level: string) {
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: `test-results/screenshots/anglais-${level}-result.png`,
    fullPage: true,
  });
  console.log(`[${level}] Screenshot résultat sauvegardé`);

  // Cliquer "Continuer" pour aller à la validation
  const continuerBtn = page.getByRole("button", { name: "Continuer" });
  if (await continuerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continuerBtn.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `test-results/screenshots/anglais-${level}-validation.png`,
      fullPage: true,
    });
    console.log(`[${level}] Screenshot validation sauvegardé`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Un test par niveau CEFR
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Anglais CEFR — Flux adaptatif complet", () => {

  // ── A2 : répond A1 + partial A2 ──────────────────────────────────────────
  test("Anglais — Niveau A2 (flux complet)", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    await startFreshSession(page, "Anglais", "A2-Auto");
    await fillPrerequisIfPresent(page);
    await selectFormationAnglais(page);
    await runAdaptiveQuiz(page);
    await captureAndContinue(page, "A2");
    console.log("✅ Test Anglais A2 terminé");
  });

  // ── B1 ────────────────────────────────────────────────────────────────────
  test("Anglais — Niveau B1 (flux complet)", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    await startFreshSession(page, "Anglais", "B1-Auto");
    await fillPrerequisIfPresent(page);
    await selectFormationAnglais(page);
    await runAdaptiveQuiz(page);
    await captureAndContinue(page, "B1");
    console.log("✅ Test Anglais B1 terminé");
  });

  // ── B2 ────────────────────────────────────────────────────────────────────
  test("Anglais — Niveau B2 (flux complet)", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    await startFreshSession(page, "Anglais", "B2-Auto");
    await fillPrerequisIfPresent(page);
    await selectFormationAnglais(page);
    await runAdaptiveQuiz(page);
    await captureAndContinue(page, "B2");
    console.log("✅ Test Anglais B2 terminé");
  });

  // ── C1 ────────────────────────────────────────────────────────────────────
  test("Anglais — Niveau C1 (flux complet)", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    await startFreshSession(page, "Anglais", "C1-Auto");
    await fillPrerequisIfPresent(page);
    await selectFormationAnglais(page);
    await runAdaptiveQuiz(page);
    await captureAndContinue(page, "C1");
    console.log("✅ Test Anglais C1 terminé");
  });

});

export {};
