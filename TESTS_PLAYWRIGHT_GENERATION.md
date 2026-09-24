# 🎭 Génération Automatique des Tests Playwright

## 📋 Vue d'ensemble

Un total de **171 tests Playwright** ont été générés automatiquement à partir des données de la base de données `wizzylearn`.

Les tests couvrent :
- **19 formations** différentes
- **88 niveaux** distincts
- **40 règles de parcours** (parcours rules)

## 📁 Structure des tests générés

```
generated-tests/
├── README.md                    # Documentation
└── formations/
    ├── anglais/
    │   ├── a1-revoir-les-bases/
    │   │   ├── parcours-1/test.spec.ts
    │   │   ├── parcours-2/test.spec.ts
    │   │   ├── parcours-3/test.spec.ts
    │   │   ├── parcours-4/test.spec.ts
    │   │   └── parcours-5/test.spec.ts
    │   ├── a2-consolider-les-bases/
    │   │   └── ... (5 parcours)
    │   ├── b1-dvelopper-lautonomie/
    │   ├── b2-renforcer-les-comptences/
    │   └── c1-se-perfectionner/
    ├── excel/
    ├── word/
    ├── photoshop/
    ├── digitales-comptences/
    └── [... 13 autres formations]
```

## 🔧 Configuration des tests

### Base URL
Tous les tests sont configurés pour utiliser :
```
https://ns-conseil-ab.mbl-service.com
```

### Flux de test standard

Chaque test suit ce flux :

1. **Navigation** → `/formations`
2. **Sélection** → Clique sur la formation (ex: "Anglais")
3. **Démarrage** → Clique sur "Commencer"
4. **Positionnement** → Remplit le test de positionnement
   - Sélectionne la première réponse de chaque question
   - Clique "Suivant" jusqu'à la fin
   - Limite de 50 questions par sécurité
5. **Résultats** → Clique "Terminer" ou "Résultats"
6. **Captures d'écran** :
   - Avant: `{test-name}-01-positionnement-end.png`
   - Après: `{test-name}-02-results.png`

## 📊 Statistiques par Formation

### Formations Bureautique Microsoft
- **Word**: 5 niveaux × 1 parcours = 5 tests
- **Excel**: 5 niveaux × 1-2 parcours = 6 tests
- **PowerPoint**: 5 niveaux × 1-2 parcours = 6 tests
- **Outlook**: 5 niveaux × 1 parcours = 5 tests
- **Mixte Office**: 6 niveaux × 1 parcours = 6 tests

### Formations Google
- **Google Docs**: 4 niveaux × 1 parcours = 4 tests
- **Google Sheets**: 4 niveaux × 1 parcours = 4 tests
- **Google Slides**: 4 niveaux × 1 parcours = 4 tests
- **Outils Collaboratifs**: 4 niveaux × 1 parcours = 4 tests

### Formations Création
- **Photoshop**: 5 niveaux × 1-2 parcours = 6 tests
- **Illustrator**: 3 niveaux × 1-2 parcours = 4 tests
- **SketchUp**: 4 niveaux × 1 parcours = 4 tests
- **GIMP**: 4 niveaux × 1 parcours = 4 tests

### Formations Spécialisées
- **Digitales Compétences**: 5 niveaux × 2 parcours = 10 tests
- **WordPress**: 3 niveaux × 1-2 parcours = 4 tests
- **IA Générative**: 6 niveaux × 1 parcours = 6 tests
- **Anglais**: 5 niveaux × 1-5 parcours = 15 tests
- **Français**: 4 niveaux × 1 parcours = 4 tests

## 🚀 Utilisation des tests

### Lancer tous les tests
```bash
npx playwright test generated-tests/formations/
```

### Lancer une formation spécifique
```bash
# Tous les tests Anglais
npx playwright test generated-tests/formations/anglais/

# Tous les tests Excel
npx playwright test generated-tests/formations/excel/
```

### Lancer un niveau spécifique
```bash
# Tous les tests Anglais A2
npx playwright test generated-tests/formations/anglais/a2-consolider-les-bases/

# Tous les tests Digitales Compétences Basique
npx playwright test generated-tests/formations/digitales-comptences/basique/
```

### Lancer un parcours spécifique
```bash
# Test Anglais A2 Parcours 1 seulement
npx playwright test generated-tests/formations/anglais/a2-consolider-les-bases/parcours-1/
```

### Mode debug
```bash
npx playwright test generated-tests/formations/ --debug
```

### Mode headed (voir le navigateur)
```bash
npx playwright test generated-tests/formations/ --headed
```

### Reporter HTML
```bash
npx playwright test generated-tests/formations/ --reporter=html
```

## 📝 Exemple de test généré

```typescript
test("anglais-a2-parcours-1 - Anglais - A2 - Consolider les bases - Parcours 1", async ({ page, context }) => {
  // Navigate to formations page
  await page.goto("https://ns-conseil-ab.mbl-service.com/formations");
  await page.waitForLoadState("networkidle");
  
  // Select formation - search for "Anglais"
  const formationSelectors = await page.locator("*:has-text(\"Anglais\")").all();
  // ... validation and click
  
  // Start session - click "Commencer" button
  // ... find and click button
  
  // Complete positionnement
  for (let attempt = 0; attempt < 50; attempt++) {
    const radios = await page.locator("input[type=\"radio\"]").all();
    if (radios.length === 0) break;
    
    await radios[0].check({ force: true });
    // ... click "Suivant"
  }
  
  // Screenshots
  await page.screenshot({ path: "./test-results/screenshots/anglais-a2-parcours-1-01-positionnement-end.png", fullPage: true });
  await page.screenshot({ path: "./test-results/screenshots/anglais-a2-parcours-1-02-results.png", fullPage: true });
});
```

## 🎯 Informations dans les commentaires

Chaque test génère automatiquement des commentaires avec :

```typescript
/**
 * Formation: anglais | Level: a2-consolider-les-bases | Parcours: 1
 * Niveau ordre: 2
 * Seuil de réussite: 5%
 * 
 * Formations proposées:
 * - Formation 1: Anglais Renforcer les compétences - TOEIC
 * - Formation 2: Anglais Se perfectionner - TOEIC
 */
```

## ⚙️ Dépendances

Les tests utilisant ExcelJS et PostgreSQL :
- `exceljs`: ^4.x (pour l'export en Excel)
- `pg`: ^8.x (pour accéder à la base de données)
- `@playwright/test`: (pour les tests)

## 📋 Points de contrôle du test

✅ Navigation vers `/formations`
✅ Sélection de la formation par son label
✅ Clique sur "Commencer"
✅ Remplissage du questionnaire de positionnement
✅ Clique sur "Suivant" entre les questions
✅ Clique sur "Terminer" pour voir les résultats
✅ Capture d'écran avant résultats
✅ Capture d'écran après résultats
✅ Validation que du contenu existe sur la page

## 🔄 Régénération des tests

Pour régénérer les tests si les données changent :

```bash
cd /var/www/Analyse-v2/projet-app/backend
node generate_playwright_tests.js
cp -r generated-tests ../frontend/
```

## 📌 Notes importantes

1. **Sélections aléatoires** : Les tests sélectionnent toujours la première option pour chaque question. Adaptez selon vos besoins.

2. **Timeouts** : Les tests attendent jusqu'à 50 questions. Ajustez `maxQuestions` si nécessaire.

3. **Screenshots** : Chaque test génère 2 captures d'écran :
   - Après le positionnement
   - Après affichage des résultats

4. **Base URL** : Actuellement configurée sur `https://ns-conseil-ab.mbl-service.com`. Modifiez dans `generate_playwright_tests.js` si besoin.

5. **Logging** : Les tests affichent des logs pour le debugging :
   - `✓ Positionnement completed after X questions`
   - `📸 Screenshot saved: ...`
   - `✅ Test completed: ...`

## 📅 Date de génération

${new Date().toLocaleString('fr-FR')}

---

**Script générateur** : `generate_playwright_tests.js`
**Base de données** : `wizzylearn` (PostgreSQL)
**URL cible** : https://ns-conseil-ab.mbl-service.com
