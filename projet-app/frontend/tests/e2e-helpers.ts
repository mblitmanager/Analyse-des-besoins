import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

/** Shared steps for the E2E journeys run against the isolated stack (scripts/run-e2e-*.sh). */

export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3003/api";

export async function apiGet<T = any>(path: string, auth = false): Promise<T> {
  const headers = auth ? { Authorization: `Bearer ${await getAdminToken()}` } : undefined;
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

// The E2E database starts without users: /auth/setup creates the default admin
// (disabled in production), then we log in to read answer keys.
let adminToken: string | undefined;
export async function getAdminToken(): Promise<string> {
  if (adminToken) return adminToken;
  await fetch(`${API_BASE_URL}/auth/setup`);
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.E2E_ADMIN_EMAIL || "admin@wizy-learn.com",
      password: process.env.E2E_ADMIN_PASSWORD || "admin123",
    }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
  adminToken = (await res.json()).access_token;
  return adminToken!;
}

export async function captureCheckpoint(page: Page, testInfo: TestInfo, name: string) {
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(name, { path: screenshotPath, contentType: "image/png" });
}

// Nearest white card around a question header. Locators from .all() are nth()-based
// and must not be reused as a `has:` filter, which re-scopes them inside each card.
export function questionCard(header: Locator) {
  return header.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' bg-white ')][1]");
}

// Step buttons render an icon next to the label, so their accessible name can be
// "Continuer arrow_forward" or "Valider mes disponibilités event_available";
// "Continuer quand même" (warning modal) is excluded.
export function continueButton(page: Page) {
  return page.getByRole("button", {
    name: /^(Continuer|Valider mes disponibilités)(\s+(arrow_forward|event_available))?$/,
  });
}

/** Answers every visible question of a workflow step (radios, checkboxes, text) and continues. */
export async function answerWorkflowStep(page: Page) {
  // Questions load asynchronously behind a spinner: wait for the step to render.
  await expect(continueButton(page)).toBeVisible({ timeout: 15_000 });

  // Answering can reveal conditional questions, hence several passes.
  const answeredGroups = new Set<string>();
  for (let pass = 0; pass < 10; pass++) {
    let answeredNewGroup = false;

    const radios = page.locator("label.option-card:visible:has(input[type=radio]), label.formation-card:visible");
    for (let index = 0; index < await radios.count(); index++) {
      const option = radios.nth(index);
      const group = await option.locator("input").first().getAttribute("name");
      if (group && !answeredGroups.has(group)) {
        await option.click();
        answeredGroups.add(group);
        answeredNewGroup = true;
      }
    }

    // Checkbox inputs have no name: answer each group through its container.
    const checkboxGroups = page.locator("div.grid:visible:has(> label.option-card input[type=checkbox])");
    for (let index = 0; index < await checkboxGroups.count(); index++) {
      const grp = checkboxGroups.nth(index);
      if (await grp.locator("input[type=checkbox]:checked").count() === 0) {
        await grp.locator("label.option-card").first().click();
        answeredNewGroup = true;
      }
    }

    const textFields = page.locator("input.Wizi-input:visible, textarea.Wizi-input:visible");
    for (let index = 0; index < await textFields.count(); index++) {
      const field = textFields.nth(index);
      if (!(await field.inputValue())) await field.fill("Réponse E2E automatique");
    }

    if (!answeredNewGroup) break;
  }

  const url = page.url();
  await expect(continueButton(page)).toBeEnabled();
  await continueButton(page).click();

  const warningContinue = page.getByRole("button", { name: "Continuer quand même" });
  await Promise.race([
    page.waitForURL((next) => next.href !== url, { timeout: 15_000 }),
    warningContinue.waitFor({ state: "visible", timeout: 15_000 }).then(() => warningContinue.click()),
  ]);
}

export async function advanceToFinalValidation(page: Page) {
  for (let step = 0; step < 10 && !page.url().endsWith("/validation"); step++) {
    await page.waitForURL(/\/(complementary|availabilities|validation)$/);
    if (page.url().endsWith("/validation")) break;
    await answerWorkflowStep(page);
  }
  await page.waitForURL("**/validation");
}

/** Identification + prerequisites, ending on the formation selection page. */
export async function startJourney(page: Page, nom: string, prenom: string) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h2")).toContainText(/identification/i);

  await page.getByRole("textbox", { name: "Nom", exact: true }).fill(nom);
  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill(prenom);
  await page.getByRole("textbox", { name: "Téléphone", exact: true }).fill("0612345678");
  await page.getByRole("button", { name: /démarrer le parcours/i }).click();

  await page.waitForURL("**/prerequis");
  const metierInput = page.locator("input.Wizi-input");
  await metierInput.waitFor({ state: "visible", timeout: 20_000 });
  await metierInput.fill("Assistant E2E");

  const situationCards = await page.locator(".formation-card").all();
  if (situationCards.length > 0) await situationCards[0].click();

  const optionCards = await page.locator(".option-card").all();
  const answeredGroups = new Set<string>();
  for (const card of optionCards) {
    const nameAttr = await card.locator("input").getAttribute("name");
    if (nameAttr && !answeredGroups.has(nameAttr)) {
      await card.click();
      answeredGroups.add(nameAttr);
    }
  }

  await page.getByRole("button", { name: /valider mon profil/i }).click();
  await page.waitForURL("**/formations");
  await page.waitForLoadState("networkidle");
}

export async function getSessionId(page: Page): Promise<string> {
  const id = await page.evaluate(() => localStorage.getItem("session_id"));
  if (!id) throw new Error("session_id absent du localStorage");
  return id;
}

export type AnswerKey = {
  id: number;
  text: string;
  responseType: string;
  metadata?: { type?: string } | null;
  options: string[];
  correctResponseIndex: number;
  correctResponseIndexes?: number[] | null;
  level?: { label: string; order: number } | null;
};

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

/** Positionnement questions with answer keys (admin API), indexed by displayed text. */
export async function loadAnswerKeys(formationSlug: string) {
  const questions: AnswerKey[] = (
    await apiGet<AnswerKey[]>(`/questions?formation=${encodeURIComponent(formationSlug)}`, true)
  ).filter((q: any) => q.type === "positionnement" && q.isActive !== false);
  const byText = new Map<string, AnswerKey[]>();
  for (const q of questions) {
    const key = normalizeText(q.text);
    byText.set(key, [...(byText.get(key) || []), q]);
  }
  return byText;
}

function correctIndexes(q: AnswerKey): number[] {
  const multi = q.responseType === "checkbox" || q.metadata?.type === "multi_select";
  return multi ? q.correctResponseIndexes || [] : [q.correctResponseIndex];
}

/**
 * Answers the questions currently displayed on the positionnement page.
 * `shouldPass(levelLabel)` decides, per level, whether answers are right or wrong.
 * Returns the level label the screen belonged to.
 */
export async function answerPositionnementScreen(
  page: Page,
  keys: Map<string, AnswerKey[]>,
  shouldPass: (levelLabel: string) => boolean,
): Promise<string | undefined> {
  const headers = await page.locator("h3.heading-primary").all();
  const screen: { header: Locator; candidates: AnswerKey[] }[] = [];
  for (const header of headers) {
    const text = normalizeText(await header.innerText());
    const candidates = keys.get(text);
    if (!candidates) throw new Error(`Question absente des corrigés admin : "${text}"`);
    screen.push({ header, candidates });
  }

  // A screen shows one level; texts shared between levels are resolved by majority.
  const votes = new Map<string, number>();
  for (const { candidates } of screen) {
    for (const q of candidates) {
      const label = q.level?.label || "";
      votes.set(label, (votes.get(label) || 0) + 1);
    }
  }
  const levelLabel = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const pass = shouldPass(levelLabel || "");

  for (const { header, candidates } of screen) {
    const q = candidates.find((c) => c.level?.label === levelLabel) || candidates[0];
    const card = questionCard(header);
    const options = card.locator(".option-card");
    if (q.responseType === "text") {
      await card.locator("textarea").fill(pass ? q.options[q.correctResponseIndex] || "E2E" : "__mauvaise_reponse__");
      continue;
    }
    const good = correctIndexes(q);
    if (pass) {
      for (const idx of good) await options.nth(idx).click();
    } else {
      // One wrong option (for multi-select, a lone wrong option is never the exact set).
      const wrong = q.options.findIndex((_, idx) => !good.includes(idx));
      if (wrong >= 0) await options.nth(wrong).click();
    }
  }
  return levelLabel;
}

/**
 * Runs the adaptive positionnement until its recommendation screen, handling the
 * low-score warning and the "high level" alert. Returns the levels seen, in order.
 */
export async function runPositionnement(
  page: Page,
  keys: Map<string, AnswerKey[]>,
  shouldPass: (levelLabel: string) => boolean,
) {
  await page.waitForURL(/\/(mise-a-niveau|positionnement)$/);
  if (page.url().includes("mise-a-niveau")) await answerWorkflowStep(page);
  await page.waitForURL("**/positionnement");

  const seenLevels: string[] = [];
  // Final screen: a recommendation, or "Évaluation terminée" when the level is too high.
  const finished = page
    .getByText(/Voici votre parcours de formation recommandé|Évaluation terminée/)
    .filter({ visible: true })
    .first();
  for (let loop = 0; loop < 20; loop++) {
    await page.waitForTimeout(500);
    if (!page.url().endsWith("/positionnement")) break;
    if (await finished.isVisible()) break;

    // Modal buttons can linger in the DOM while their transition closes them.
    const lowScoreContinue = page.getByRole("button", { name: "Continuer quand même" });
    if (await lowScoreContinue.isVisible()) {
      await lowScoreContinue.click({ timeout: 5_000 }).catch(() => {});
      continue;
    }
    const keepFormation = page.getByRole("button", { name: /^Continuer avec / });
    if (await keepFormation.isVisible()) {
      await keepFormation.click({ timeout: 5_000 }).catch(() => {});
      continue;
    }

    if ((await page.locator("h3.heading-primary").count()) === 0) continue;
    const before = await screenSignature(page);
    const level = await answerPositionnementScreen(page, keys, shouldPass);
    if (level) seenLevels.push(level);

    const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Wait until the submitted screen is replaced (next level, modal, final screen or
    // another page) so the following answers never target the previous questions.
    await expect
      .poll(
        async () => {
          if (!page.url().endsWith("/positionnement")) return "changed";
          if (await finished.isVisible()) return "changed";
          if (await lowScoreContinue.isVisible() || await keepFormation.isVisible()) return "changed";
          const current = await screenSignature(page);
          return current && current !== before ? "changed" : "same";
        },
        { timeout: 30_000, message: "l'écran de positionnement ne change pas après validation" },
      )
      .toBe("changed");
  }
  return seenLevels;
}

async function screenSignature(page: Page): Promise<string> {
  return (await page.locator("h3.heading-primary").allInnerTexts().catch(() => [])).join("|");
}
