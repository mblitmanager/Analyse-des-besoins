# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: formations-parcours-live.spec.ts >> Catalogue — par formation >> chaque formation active est sélectionnable dans le front
- Location: tests\formations-parcours-live.spec.ts:66:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 90000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/positionnement" until "load"
  navigated to "http://localhost:5173/formations"
  navigated to "http://localhost:5173/mise-a-niveau"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e7]:
      - img "AOPIA" [ref=e8]
      - img "Like Formation" [ref=e10]
  - main [ref=e11]:
    - generic [ref=e19]:
      - heading "Analyses des besoins" [level=1] [ref=e20]
      - paragraph [ref=e21]: Répondez aux questions pour adapter votre parcours
    - generic [ref=e22]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - paragraph [ref=e27]: "Étude de l'anglais jusqu'à :"
          - generic [ref=e28]:
            - generic [ref=e30] [cursor=pointer]: Collège
            - generic [ref=e33] [cursor=pointer]: Lycée
            - generic [ref=e36] [cursor=pointer]: Bac + 2
            - generic [ref=e39] [cursor=pointer]: Bac + 5
        - generic [ref=e41]:
          - paragraph [ref=e43]: Utilisation professionnelle de l'anglais ?
          - generic [ref=e44]:
            - generic [ref=e46] [cursor=pointer]: Oui
            - generic [ref=e49] [cursor=pointer]: Non
        - generic [ref=e51]:
          - paragraph [ref=e53]: Utilisation personnelle de l'anglais ?
          - generic [ref=e54]:
            - generic [ref=e56] [cursor=pointer]: Oui
            - generic [ref=e59] [cursor=pointer]: Non
      - button "Continuer arrow_forward" [ref=e63]:
        - generic [ref=e64]: Continuer
        - generic [ref=e65]: arrow_forward
  - contentinfo [ref=e66]:
    - generic [ref=e67]:
      - navigation [ref=e68]:
        - link "Règlement intérieur" [ref=e69] [cursor=pointer]:
          - /url: https://ns-conseil.com/reglement-interieur/
        - link "CGV" [ref=e70] [cursor=pointer]:
          - /url: https://ns-conseil.com/cgv/
        - link "Mentions légales" [ref=e71] [cursor=pointer]:
          - /url: /mentions-legales
        - link "Respect de la vie privée" [ref=e72] [cursor=pointer]:
          - /url: /respect-vie-privee
        - link "Politique de confidentialité" [ref=e73] [cursor=pointer]:
          - /url: /politique-confidentialite
      - paragraph [ref=e75]:
        - text: Besoin d'aide ?
        - link "Contactez le support" [ref=e76] [cursor=pointer]:
          - /url: mailto:contact@ns-conseil.com
      - generic [ref=e77]: © 2026 NS Conseil. Tous droits réservés.
```

# Test source

```ts
  28  | };
  29  | 
  30  | async function getActiveFormations(request: APIRequestContext): Promise<Formation[]> {
  31  |   const response = await request.get(`${apiBaseUrl}/formations`);
  32  |   expect(response.ok(), 'Le catalogue des formations doit être accessible').toBeTruthy();
  33  |   const formations = (await response.json()) as Formation[];
  34  |   return formations.filter((formation) => formation.isActive);
  35  | }
  36  | 
  37  | async function openFormationSelection(page: import('@playwright/test').Page) {
  38  |   await page.goto('/');
  39  |   await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Playwright');
  40  |   await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Catalogue');
  41  |   await page.getByRole('textbox', { name: 'Téléphone', exact: true }).fill('0612345678');
  42  |   await page.getByRole('button', { name: /démarrer le parcours/i }).click();
  43  |   await page.waitForURL(/\/(prerequis|formations)$/);
  44  | 
  45  |   // Le workflow peut désactiver l'étape prérequis : dans ce cas, le front
  46  |   // redirige directement vers le catalogue.
  47  |   if (page.url().endsWith('/prerequis')) {
  48  |     await page.locator('input.Wizi-input').first().fill('Test automatisé');
  49  |     await page.locator('.formation-card').first().click();
  50  | 
  51  |     const answered = new Set<string>();
  52  |     for (const option of await page.locator('.option-card').all()) {
  53  |       const name = await option.locator('input').getAttribute('name');
  54  |       if (name && !answered.has(name)) {
  55  |         await option.click();
  56  |         answered.add(name);
  57  |       }
  58  |     }
  59  | 
  60  |     await page.getByRole('button', { name: /valider mon profil/i }).click();
  61  |     await page.waitForURL('**/formations');
  62  |   }
  63  | }
  64  | 
  65  | test.describe('Catalogue — par formation', () => {
  66  |   test('chaque formation active est sélectionnable dans le front', async ({ page, request }, testInfo) => {
  67  |     test.setTimeout(90_000);
  68  |     const activeFormations = await getActiveFormations(request);
  69  |     const formations = activeFormations.filter((formation) => !formation.availableInP3Only);
  70  |     // Le groupe IA reste visible car il expose aussi Excel + IA et Word + IA,
  71  |     // deux spécialisations accessibles hors P3. Les autres entrées P3-only,
  72  |     // notamment Outlook, doivent rester masquées ici.
  73  |     const p3OnlyFormations = activeFormations.filter(
  74  |       (formation) => formation.availableInP3Only && formation.label.trim() !== 'Intelligence Artificielle Générative',
  75  |     );
  76  |     expect(formations, 'Au moins une formation standard active est requise').not.toHaveLength(0);
  77  |     await openFormationSelection(page);
  78  | 
  79  |     // Une formation réservée au P3 ne doit pas être proposée avant le passage
  80  |     // en mode P3. Outlook est notamment couvert par cette règle.
  81  |     for (const formation of p3OnlyFormations) {
  82  |       await test.step(`${formation.label.trim()} (P3 uniquement)`, async () => {
  83  |         await expect(
  84  |           page.locator('.formation-card').filter({ hasText: formation.label.trim() }),
  85  |           `« ${formation.label.trim()} » ne doit être proposée qu'en P3`,
  86  |         ).toHaveCount(0);
  87  |       });
  88  |     }
  89  | 
  90  |     for (const formation of formations) {
  91  |       const label = formation.label.trim();
  92  | 
  93  |       await test.step(`${label} (id ${formation.id})`, async () => {
  94  |         // Les spécialisations IA sont regroupées sous leur formation parente.
  95  |         if (label === 'Excel + IA' || label === 'Word + IA') {
  96  |           await page.locator('.formation-card').filter({ hasText: 'Intelligence Artificielle Générative' }).click();
  97  |         }
  98  | 
  99  |         const card = label === 'Excel + IA' || label === 'Word + IA'
  100 |           ? page.getByRole('button', { name: label, exact: false })
  101 |           : page.locator('.formation-card').filter({ hasText: label }).first();
  102 |         await expect(card, `Carte introuvable pour « ${label} »`).toBeVisible();
  103 |         await card.click();
  104 | 
  105 |         if (label === 'Intelligence Artificielle Générative') {
  106 |           await expect(page.getByRole('button', { name: /excel \+ ia/i })).toBeVisible();
  107 |           await expect(page.getByRole('button', { name: /word \+ ia/i })).toBeVisible();
  108 |         } else {
  109 |           await expect(page.getByText('Formation sélectionnée', { exact: true }).last()).toBeVisible();
  110 |           await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
  111 |           await expect(page.getByRole('button', { name: /continuer/i }).last()).toBeEnabled();
  112 |         }
  113 | 
  114 |         const screenshot = await page.screenshot({
  115 |           path: `test-results/screenshots/catalogue-formation-${formation.id}.png`,
  116 |           fullPage: true,
  117 |         });
  118 |         await testInfo.attach(`formation-${formation.id}-${label}`, {
  119 |           body: screenshot,
  120 |           contentType: 'image/png',
  121 |         });
  122 | 
  123 |         // Le groupe IA sert seulement à révéler les deux spécialisations. Les
  124 |         // scénarios Excel + IA et Word + IA poursuivent eux-mêmes le parcours.
  125 |         if (label === 'Intelligence Artificielle Générative') return;
  126 | 
  127 |         await page.getByRole('button', { name: /continuer/i }).last().click();
> 128 |         await page.waitForURL('**/positionnement');
      |                    ^ Error: page.waitForURL: Test timeout of 90000ms exceeded.
  129 |         await expect(page.getByRole('heading', { name: /test de positionnement/i })).toBeVisible();
  130 | 
  131 |         const parcoursScreenshot = await page.screenshot({
  132 |           path: `test-results/screenshots/parcours-formation-${formation.id}-positionnement.png`,
  133 |           fullPage: true,
  134 |         });
  135 |         await testInfo.attach(`parcours-${formation.id}-positionnement`, {
  136 |           body: parcoursScreenshot,
  137 |           contentType: 'image/png',
  138 |         });
  139 | 
  140 |         // Retour au catalogue pour la formation suivante, dans la même session.
  141 |         await page.goto('/formations');
  142 |         await expect(page.getByRole('heading', { name: /quelle formation souhaitez-vous suivre/i })).toBeVisible();
  143 |       });
  144 |     }
  145 |   });
  146 | });
  147 | 
  148 | test.describe('Catalogue — par parcours', () => {
  149 |   test('chaque parcours actif est complet et rattaché à une formation active', async ({ request }) => {
  150 |     const formations = await getActiveFormations(request);
  151 |     const activeFormationIds = new Set(formations.map((formation) => formation.id));
  152 | 
  153 |     const response = await request.get(`${apiBaseUrl}/parcours?activeOnly=true`);
  154 |     expect(response.ok(), 'Les règles de parcours doivent être accessibles').toBeTruthy();
  155 |     const parcoursList = (await response.json()) as Parcours[];
  156 |     expect(parcoursList, 'Au moins un parcours actif est requis').not.toHaveLength(0);
  157 | 
  158 |     for (const parcours of parcoursList) {
  159 |       await test.step(`${parcours.parcoursTitle ?? `règle #${parcours.id}`}`, async () => {
  160 |         expect(parcours.isActive).toBeTruthy();
  161 |         expect(parcours.parcoursTitle?.trim(), 'Un parcours doit avoir un intitulé').toBeTruthy();
  162 |         expect(parcours.condition?.trim(), 'Un parcours doit avoir une condition').toBeTruthy();
  163 |         expect(parcours.formation?.trim(), 'Un parcours doit référencer une formation').toBeTruthy();
  164 |         // Un parcours peut être mono-module (ex. certaines spécialisations IA).
  165 |         // Dans tous les cas, il doit proposer au moins une formation.
  166 |         expect(
  167 |           parcours.formation1?.trim() || parcours.formation2?.trim(),
  168 |           'Un parcours doit contenir au moins un module recommandé',
  169 |         ).toBeTruthy();
  170 | 
  171 |         if (parcours.formationId !== null) {
  172 |           expect(
  173 |             activeFormationIds.has(parcours.formationId),
  174 |             `Le parcours « ${parcours.parcoursTitle} » pointe vers une formation inactive ou inexistante`,
  175 |           ).toBeTruthy();
  176 |         }
  177 |       });
  178 |     }
  179 |   });
  180 | });
  181 | 
```