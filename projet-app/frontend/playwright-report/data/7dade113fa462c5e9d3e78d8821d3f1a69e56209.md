# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-p3-flow.spec.ts >> E2E Dynamic Formations Flow to P3 >> Flow for TOEIC up to P3
- Location: tests\e2e-p3-flow.spec.ts:67:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: /métier/i })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e7]:
      - img "AOPIA" [ref=e8]
      - img "Like Formation" [ref=e10]
  - main [ref=e11]:
    - generic [ref=e12]:
      - heading "Situation & Compétences Numériques" [level=1] [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e25]: work_outline
          - heading "Votre Profil" [level=2] [ref=e26]
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Votre métier (poste actuel)
            - 'textbox "Ex: Assistant administratif, Comptable..." [ref=e30]'
          - generic [ref=e31]:
            - generic [ref=e32]: Votre situation actuelle
            - generic [ref=e33]:
              - generic [ref=e35] [cursor=pointer]:
                - checkbox "work Salarié" [ref=e36]
                - generic [ref=e37]:
                  - generic [ref=e39]: work
                  - generic [ref=e40]: Salarié
              - generic [ref=e43] [cursor=pointer]:
                - checkbox "storefront Indépendant" [ref=e44]
                - generic [ref=e45]:
                  - generic [ref=e47]: storefront
                  - generic [ref=e48]: Indépendant
              - generic [ref=e51] [cursor=pointer]:
                - checkbox "search Demandeur d’emploi" [ref=e52]
                - generic [ref=e53]:
                  - generic [ref=e55]: search
                  - generic [ref=e56]: Demandeur d’emploi
              - generic [ref=e59] [cursor=pointer]:
                - checkbox "psychology Reconversion" [ref=e60]
                - generic [ref=e61]:
                  - generic [ref=e63]: psychology
                  - generic [ref=e64]: Reconversion
      - generic [ref=e66]:
        - generic [ref=e69]:
          - generic [ref=e71]: devices
          - heading "Compétences Numériques" [level=2] [ref=e72]
        - generic [ref=e73]:
          - generic [ref=e74]:
            - generic [ref=e75]:
              - generic [ref=e76]: "1"
              - paragraph [ref=e77]: A quelle fréquence utilisez-vous un ordinateur ?
            - generic [ref=e78]:
              - generic [ref=e80] [cursor=pointer]: Quotidiennement
              - generic [ref=e83] [cursor=pointer]: Occasionnellement
              - generic [ref=e86] [cursor=pointer]: Jamais
          - generic [ref=e88]:
            - generic [ref=e89]:
              - generic [ref=e90]: "2"
              - paragraph [ref=e91]: Savez-vous allumer un ordinateur, utiliser le clavier et la souris ?
            - generic [ref=e92]:
              - generic [ref=e94] [cursor=pointer]: Oui
              - generic [ref=e97] [cursor=pointer]: Oui avec quelques difficultés
              - generic [ref=e100] [cursor=pointer]: Non
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]: "3"
              - paragraph [ref=e105]: "Savez-vous vous repérer dans l’environnement Windows : bureau, menu démarrer, fenêtres, icônes, applications… ?"
            - generic [ref=e106]:
              - generic [ref=e108] [cursor=pointer]: Oui
              - generic [ref=e111] [cursor=pointer]: Oui avec quelques difficultés
              - generic [ref=e114] [cursor=pointer]: Non
          - generic [ref=e116]:
            - generic [ref=e117]:
              - generic [ref=e118]: "4"
              - paragraph [ref=e119]: A quelle fréquence utilisez-vous internet ?
            - generic [ref=e120]:
              - generic [ref=e122] [cursor=pointer]: Quotidiennement
              - generic [ref=e125] [cursor=pointer]: Occasionnellement
              - generic [ref=e128] [cursor=pointer]: Jamais
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]: "5"
              - paragraph [ref=e133]: Savez-vous créer un dossier et y ranger et renommer un fichier?
            - generic [ref=e134]:
              - generic [ref=e136] [cursor=pointer]: Oui
              - generic [ref=e139] [cursor=pointer]: Oui avec quelques difficultés
              - generic [ref=e142] [cursor=pointer]: Non
          - generic [ref=e144]:
            - generic [ref=e145]:
              - generic [ref=e146]: "6"
              - paragraph [ref=e147]: Utilisez-vous la visioconférence (Zoom, Teams, etc…)?
            - generic [ref=e148]:
              - generic [ref=e150] [cursor=pointer]: Oui
              - generic [ref=e153] [cursor=pointer]: Non
          - generic [ref=e155]:
            - generic [ref=e156]:
              - generic [ref=e157]: "7"
              - paragraph [ref=e158]: A quelle fréquence utilisez-vous votre mail ?
            - generic [ref=e159]:
              - generic [ref=e161] [cursor=pointer]: Quotidiennement
              - generic [ref=e164] [cursor=pointer]: Occasionnellement
              - generic [ref=e167] [cursor=pointer]: Jamais
      - generic [ref=e169]:
        - button "arrow_back Retour" [ref=e170]:
          - generic [ref=e171]: arrow_back
          - text: Retour
        - button "Valider mon profil arrow_forward" [ref=e172] [cursor=pointer]:
          - generic [ref=e173]: Valider mon profil
          - generic [ref=e174]: arrow_forward
  - contentinfo [ref=e175]:
    - generic [ref=e176]:
      - navigation [ref=e177]:
        - link "Règlement intérieur" [ref=e178] [cursor=pointer]:
          - /url: https://ns-conseil.com/reglement-interieur/
        - link "CGV" [ref=e179] [cursor=pointer]:
          - /url: https://ns-conseil.com/cgv/
        - link "Mentions légales" [ref=e180] [cursor=pointer]:
          - /url: /mentions-legales
        - link "Respect de la vie privée" [ref=e181] [cursor=pointer]:
          - /url: /respect-vie-privee
        - link "Politique de confidentialité" [ref=e182] [cursor=pointer]:
          - /url: /politique-confidentialite
      - paragraph [ref=e184]:
        - text: Besoin d'aide ?
        - link "Contactez le support" [ref=e185] [cursor=pointer]:
          - /url: mailto:contact@ns-conseil.com
      - generic [ref=e186]: © 2026 NS Conseil. Tous droits réservés.
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
  84  |       await expect(page.locator("h1")).toContainText(/situation/i);
  85  | 
  86  |       // Fill metier & select situation
> 87  |       await page.getByRole("textbox", { name: /métier/i }).fill("Assistant E2E");
      |                                                            ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  185 |             console.warn(`No match found in DB for question: "${qText}". Selecting fallback.`);
  186 |             // Fallback: click first option card if visible
  187 |             const firstOpt = parentCard.locator(".option-card").first();
```