# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-p3-flow.spec.ts >> E2E Dynamic Formations Flow to P3 >> Flow for WORD up to P3
- Location: tests\e2e-p3-flow.spec.ts:67:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /situation/i
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- banner:
  - img "AOPIA"
  - img "Like Formation"
- main:
  - paragraph: Chargement...
- contentinfo:
  - navigation:
    - link "Règlement intérieur":
      - /url: https://ns-conseil.com/reglement-interieur/
    - link "CGV":
      - /url: https://ns-conseil.com/cgv/
    - link "Mentions légales":
      - /url: /mentions-legales
    - link "Respect de la vie privée":
      - /url: /respect-vie-privee
    - link "Politique de confidentialité":
      - /url: /politique-confidentialite
  - paragraph:
    - text: Besoin d'aide ?
    - link "Contactez le support":
      - /url: mailto:contact@ns-conseil.com
  - text: © 2026 NS Conseil. Tous droits réservés.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const API_BASE_URL = "http://localhost:3001/api";
  4   | 
  5   | // Helper to fetch formations and their levels from the API
  6   | async function fetchFormations() {
  7   |   try {
  8   |     const res = await fetch(`${API_BASE_URL}/formations`);
  9   |     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  10  |     const data = await res.json();
  11  |     return data.filter((f: any) => f.isActive);
  12  |   } catch (err) {
  13  |     console.error("Failed to fetch formations from backend API:", err);
  14  |     // Return a fallback list if backend is not responsive or has no seed
  15  |     return [
  16  |       { id: 44, slug: "word", label: "Word" },
  17  |       { id: 43, slug: "excel", label: "Excel" },
  18  |       { id: 10, slug: "toeic", label: "Anglais" },
  19  |       { id: 22, slug: "wordpress", label: "WordPress" }
  20  |     ];
  21  |   }
  22  | }
  23  | 
  24  | // Helper to fetch all questions for positionnement
  25  | async function fetchAllPositionnementQuestions() {
  26  |   try {
  27  |     const res = await fetch(`${API_BASE_URL}/questions`);
  28  |     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  29  |     const data = await res.json();
  30  |     return data.filter((q: any) => q.type === "positionnement" && q.isActive);
  31  |   } catch (err) {
  32  |     console.error("Failed to fetch questions from backend API:", err);
  33  |     return [];
  34  |   }
  35  | }
  36  | 
  37  | // Helper to fetch prerequisite questions
  38  | async function fetchPrerequisiteQuestions() {
  39  |   try {
  40  |     const res = await fetch(`${API_BASE_URL}/questions/prerequisites`);
  41  |     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  42  |     return await res.json();
  43  |   } catch (err) {
  44  |     console.error("Failed to fetch prerequisites from backend API:", err);
  45  |     return [];
  46  |   }
  47  | }
  48  | 
  49  | test.describe("E2E Dynamic Formations Flow to P3", () => {
  50  |   let formations: any[] = [];
  51  |   let questions: any[] = [];
  52  |   let prereqs: any[] = [];
  53  | 
  54  |   test.beforeAll(async () => {
  55  |     formations = await fetchFormations();
  56  |     questions = await fetchAllPositionnementQuestions();
  57  |     prereqs = await fetchPrerequisiteQuestions();
  58  |     console.log(`Loaded ${formations.length} formations and ${questions.length} questions for E2E tests.`);
  59  |   });
  60  | 
  61  |   // We define a test case for a few key formations to run through different paths.
  62  |   // Testing all 20 formations in one run would be extremely slow, so we pick representative ones:
  63  |   // Word, Excel, Toeic, WordPress, SketchUp
  64  |   const targetFormations = ["word", "excel", "toeic", "wordpress"];
  65  | 
  66  |   for (const slug of targetFormations) {
  67  |     test(`Flow for ${slug.toUpperCase()} up to P3`, async ({ page }) => {
  68  |       // Find current formation details
  69  |       const currentFormation = formations.find(f => f.slug === slug) || { slug, label: slug };
  70  |       console.log(`Starting E2E flow for: ${currentFormation.label}`);
  71  | 
  72  |       // 1. Go to homepage
  73  |       await page.goto("/");
  74  |       await expect(page.locator("h2")).toContainText(/identification/i);
  75  | 
  76  |       // 2. Fill User Profile
  77  |       await page.getByRole("textbox", { name: "Nom", exact: true }).fill("TestE2E");
  78  |       await page.getByRole("textbox", { name: "Prénom", exact: true }).fill(slug.toUpperCase());
  79  |       await page.getByRole("textbox", { name: "Téléphone", exact: true }).fill("0612345678");
  80  |       await page.getByRole("button", { name: /démarrer le parcours/i }).click();
  81  | 
  82  |       // 3. Prerequis Page
  83  |       await page.waitForURL("**/prerequis");
> 84  |       await expect(page.locator("h1")).toContainText(/situation/i);
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  85  | 
  86  |       // Fill metier & select situation
  87  |       await page.getByRole("textbox", { name: /métier/i }).fill("Assistant E2E");
  88  |       
  89  |       // Select first situation card
  90  |       const situationCards = await page.locator(".formation-card").all();
  91  |       if (situationCards.length > 0) {
  92  |         await situationCards[0].click();
  93  |       }
  94  | 
  95  |       // Answer prerequisite questions on screen
  96  |       const optionCards = await page.locator(".option-card").all();
  97  |       // Click first option for each unique question radio group
  98  |       const answeredGroups = new Set<string>();
  99  |       for (const card of optionCards) {
  100 |         const nameAttr = await card.locator("input").getAttribute("name");
  101 |         if (nameAttr && !answeredGroups.has(nameAttr)) {
  102 |           await card.click();
  103 |           answeredGroups.add(nameAttr);
  104 |         }
  105 |       }
  106 | 
  107 |       // Submit prerequisites
  108 |       await page.getByRole("button", { name: /valider mon profil/i }).click();
  109 | 
  110 |       // 4. Formation Selection
  111 |       await page.waitForURL("**/formations");
  112 |       
  113 |       // Click target formation card
  114 |       // We look for a card with correct text
  115 |       const formCard = page.locator(".formation-card").filter({ hasText: new RegExp(currentFormation.label, "i") }).first();
  116 |       await formCard.click();
  117 |       
  118 |       // Continue to quiz
  119 |       await page.getByRole("button", { name: /continuer/i }).click();
  120 | 
  121 |       // 5. Positionnement Quiz Page
  122 |       await page.waitForURL("**/positionnement");
  123 | 
  124 |       // Adaptive quiz loop
  125 |       let quizFinished = false;
  126 |       let loopCount = 0;
  127 |       while (!quizFinished && loopCount < 10) {
  128 |         loopCount++;
  129 |         // Wait a short time for questions to render
  130 |         await page.waitForTimeout(1000);
  131 | 
  132 |         // Check if we reached the results section inside PositionnementView
  133 |         const resultsTitle = page.locator("h1", { hasText: /félicitations/i });
  134 |         if (await resultsTitle.isVisible()) {
  135 |           console.log("Reached results page within quiz!");
  136 |           quizFinished = true;
  137 |           break;
  138 |         }
  139 | 
  140 |         // Locate all visible question headers
  141 |         const headers = await page.locator("h3.heading-primary").all();
  142 |         if (headers.length === 0) {
  143 |           // Check if there is a next/terminer button or we already finished
  144 |           const nextBtn = page.getByRole("button", { name: /suivant|terminer/i });
  145 |           if (await nextBtn.isVisible()) {
  146 |             await nextBtn.click();
  147 |             continue;
  148 |           }
  149 |           break;
  150 |         }
  151 | 
  152 |         console.log(`Answering ${headers.length} questions on this screen...`);
  153 |         for (const header of headers) {
  154 |           const qText = (await header.innerText()).trim();
  155 |           const cleanQText = qText.replace(/\s+/g, " ");
  156 | 
  157 |           // Find match in our questions DB
  158 |           const matchingQ = questions.find(
  159 |             q => q.text.replace(/\s+/g, " ").trim() === cleanQText
  160 |           );
  161 | 
  162 |           const parentCard = page.locator("div.bg-white", { has: header }).first();
  163 | 
  164 |           if (matchingQ) {
  165 |             if (matchingQ.responseType === "text") {
  166 |               await parentCard.locator("textarea").fill("Réponse E2E automatique");
  167 |             } else if (matchingQ.responseType === "checkbox" || matchingQ.metadata?.type === "multi_select") {
  168 |               const correctIndices = matchingQ.correctResponseIndexes || [matchingQ.correctResponseIndex];
  169 |               for (const idx of correctIndices) {
  170 |                 if (idx !== -1 && idx < matchingQ.options.length) {
  171 |                   const optText = matchingQ.options[idx];
  172 |                   await parentCard.locator(".option-card", { hasText: optText }).first().click();
  173 |                 }
  174 |               }
  175 |             } else { // radio/qcm
  176 |               const idx = matchingQ.correctResponseIndex;
  177 |               if (idx !== -1 && idx < matchingQ.options.length) {
  178 |                 const optText = matchingQ.options[idx];
  179 |                 await parentCard.locator(".option-card", { hasText: optText }).first().click();
  180 |               } else {
  181 |                 await parentCard.locator(".option-card").first().click();
  182 |               }
  183 |             }
  184 |           } else {
```