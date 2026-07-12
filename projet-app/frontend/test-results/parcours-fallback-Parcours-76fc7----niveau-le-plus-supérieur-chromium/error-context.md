# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: parcours-fallback.spec.ts >> Parcours fallback - niveau le plus supérieur
- Location: tests\parcours-fallback.spec.ts:14:1

# Error details

```
Error: page.textContent: selector: expected string, got undefined
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
      - generic [ref=e13]:
        - heading "Identification" [level=2] [ref=e14]
        - paragraph [ref=e15]: Veuillez renseigner vos informations pour accéder à notre test de positionnement.
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Date de complétude
          - generic [ref=e19]: 12/07/2026
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: Civilité
            - generic [ref=e23]:
              - generic [ref=e24] [cursor=pointer]:
                - radio "Monsieur" [ref=e25]
                - generic [ref=e26]: Monsieur
              - generic [ref=e27] [cursor=pointer]:
                - radio "Madame" [checked] [active] [ref=e28]
                - generic [ref=e29]: Madame
            - generic [ref=e30]:
              - generic [ref=e31]:
                - generic [ref=e32]: Nom
                - textbox "Nom" [ref=e33]
              - generic [ref=e34]:
                - generic [ref=e35]: Prénom
                - textbox "Prénom" [ref=e36]
          - generic [ref=e37]:
            - generic [ref=e38]: Téléphone
            - generic [ref=e39]:
              - generic:
                - generic: call
              - textbox "Téléphone" [ref=e40]:
                - /placeholder: 06 12 34 56 78
          - generic [ref=e41]:
            - generic [ref=e42]: Conseiller commercial (facultatif)
            - generic [ref=e43]:
              - generic:
                - generic: person
              - textbox "Conseiller commercial (facultatif)" [ref=e44]:
                - /placeholder: Nom de votre conseiller
          - button "Démarrer le parcours arrow_forward" [ref=e46] [cursor=pointer]:
            - generic [ref=e47]: Démarrer le parcours
            - generic [ref=e48]: arrow_forward
        - generic [ref=e50]:
          - generic [ref=e51]: lock
          - text: Sécurisé et confidentiel
  - contentinfo [ref=e52]:
    - generic [ref=e53]:
      - navigation [ref=e54]:
        - link "Règlement intérieur" [ref=e55] [cursor=pointer]:
          - /url: https://ns-conseil.com/reglement-interieur/
        - link "CGV" [ref=e56] [cursor=pointer]:
          - /url: https://ns-conseil.com/cgv/
        - link "Mentions légales" [ref=e57] [cursor=pointer]:
          - /url: /mentions-legales
        - link "Respect de la vie privée" [ref=e58] [cursor=pointer]:
          - /url: /respect-vie-privee
        - link "Politique de confidentialité" [ref=e59] [cursor=pointer]:
          - /url: /politique-confidentialite
      - paragraph [ref=e61]:
        - text: Besoin d'aide ?
        - link "Contactez le support" [ref=e62] [cursor=pointer]:
          - /url: mailto:contact@ns-conseil.com
      - generic [ref=e63]: © 2026 NS Conseil. Tous droits réservés.
```

# Test source

```ts
  8   |  * - Parcours inférieur à basique (condition = Initial)
  9   |  * - Parcours opérationnel (condition = Opérationnel)
  10  |  * - Niveau max configuré = Opérationnel
  11  |  * - Si pas de règle masquée correspondante, doit retourner le parcours opérationnel
  12  |  */
  13  | 
  14  | test("Parcours fallback - niveau le plus supérieur", async ({ page }) => {
  15  |   // Navigate to formations
  16  |   await page.goto("/formations");
  17  |   await page.waitForLoadState("networkidle");
  18  |   
  19  |   // Select formation Word
  20  |   const formationSelector = page.locator("*:has-text(\"Word\")").first();
  21  |   if (await formationSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
  22  |     await formationSelector.click();
  23  |     await page.waitForLoadState("networkidle");
  24  |   }
  25  |   
  26  |   // Start session - click Commencer
  27  |   let commencerFound = false;
  28  |   for (let i = 0; i < 3; i++) {
  29  |     const buttons = await page.locator("button").all();
  30  |     for (const btn of buttons) {
  31  |       const text = await btn.textContent();
  32  |       if (text?.toLowerCase().includes("commencer")) {
  33  |         await btn.click();
  34  |         await page.waitForLoadState("networkidle");
  35  |         commencerFound = true;
  36  |         break;
  37  |       }
  38  |     }
  39  |     if (commencerFound) break;
  40  |     await page.waitForTimeout(500);
  41  |   }
  42  |   
  43  |   // Complete positionnement avec un score élevé (pour déclencher le cas de fallback)
  44  |   // On simule un score qui ne correspond à aucune règle masquée
  45  |   let questionCount = 0;
  46  |   for (let attempt = 0; attempt < 30; attempt++) {
  47  |     const radios = await page.locator("input[type=\"radio\"]").all();
  48  |     if (radios.length === 0) {
  49  |       console.log("Positionnement complete after " + questionCount + " questions");
  50  |       break;
  51  |     }
  52  |     
  53  |     // Sélectionner la dernière réponse (score élevé) pour simuler un niveau avancé
  54  |     const lastRadio = radios[radios.length - 1];
  55  |     await lastRadio.check({ force: true });
  56  |     questionCount++;
  57  |     await page.waitForTimeout(150);
  58  |     
  59  |     // Click Suivant
  60  |     const buttons = await page.locator("button").all();
  61  |     let suivantClicked = false;
  62  |     for (const btn of buttons) {
  63  |       const text = await btn.textContent();
  64  |       if (text?.toLowerCase().includes("suivant")) {
  65  |         await btn.click();
  66  |         await page.waitForLoadState("networkidle");
  67  |         suivantClicked = true;
  68  |         break;
  69  |       }
  70  |     }
  71  |     
  72  |     if (!suivantClicked) {
  73  |       console.log("No Suivant button after " + questionCount + " questions");
  74  |       break;
  75  |     }
  76  |   }
  77  |   
  78  |   // Wait and screenshot positionnement end
  79  |   await page.waitForTimeout(1000);
  80  |   await page.screenshot({
  81  |     path: "./test-results/screenshots/parcours-fallback-01-positionnement-end.png",
  82  |     fullPage: true
  83  |   });
  84  |   
  85  |   // Click Terminer to go to results
  86  |   await page.waitForTimeout(500);
  87  |   let terminerClicked = false;
  88  |   for (let i = 0; i < 3; i++) {
  89  |     const buttons = await page.locator("button").all();
  90  |     for (const btn of buttons) {
  91  |       const text = await btn.textContent();
  92  |       if (text?.toLowerCase().includes("terminer") || text?.toLowerCase().includes("résultat") || text?.toLowerCase().includes("finish")) {
  93  |         await btn.click();
  94  |         await page.waitForLoadState("networkidle");
  95  |         terminerClicked = true;
  96  |         break;
  97  |       }
  98  |     }
  99  |     if (terminerClicked) break;
  100 |     await page.waitForTimeout(300);
  101 |   }
  102 |   
  103 |   // Wait for results page
  104 |   await page.waitForTimeout(2000);
  105 |   
  106 |   // Vérifier que le parcours affiché est celui avec le niveau le plus supérieur
  107 |   // On vérifie la présence du mot "Opérationnel" dans les résultats
> 108 |   const pageContent = await page.textContent();
      |                                  ^ Error: page.textContent: selector: expected string, got undefined
  109 |   const hasOperationnel = pageContent?.toLowerCase().includes("opérationnel");
  110 |   
  111 |   console.log("Parcours fallback test - Opérationnel found:", hasOperationnel);
  112 |   
  113 |   // Screenshot results
  114 |   await page.screenshot({
  115 |     path: "./test-results/screenshots/parcours-fallback-02-results.png",
  116 |     fullPage: true
  117 |   });
  118 |   
  119 |   // Assertion : le parcours doit contenir "Opérationnel" (niveau le plus supérieur)
  120 |   expect(hasOperationnel).toBeTruthy();
  121 |   
  122 |   console.log("Done: Parcours fallback test");
  123 | });
  124 | 
  125 | export {};
  126 | 
```