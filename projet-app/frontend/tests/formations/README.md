# Test Matrix - Formations / Niveaux / Parcours

Structure de test complète organisée par formation, niveau et parcours.

## 📁 Structure des Répertoires

```
tests/formations/
├── anglais/
│   ├── p1/
│   │   ├── parcours-1/
│   │   │   └── test.spec.ts
│   │   └── parcours-2/
│   │       └── test.spec.ts
│   └── p2/
│       ├── parcours-1/
│       │   └── test.spec.ts
│       └── parcours-2/
│           └── test.spec.ts
├── excel/
│   ├── p1/
│   │   ├── parcours-1/
│   │   │   └── test.spec.ts
│   │   └── parcours-2/
│   │       └── test.spec.ts
│   ├── p2/
│   │   ├── parcours-1/
│   │   │   └── test.spec.ts
│   │   └── parcours-2/
│   │       └── test.spec.ts
│   └── p3/
│       ├── parcours-1/
│       │   └── test.spec.ts
│       └── parcours-2/
│           └── test.spec.ts
├── word/
│   ├── p1/
│   │   ├── parcours-1/
│   │   │   └── test.spec.ts
│   │   └── parcours-2/
│   │       └── test.spec.ts
│   ├── p2/
│   │   ├── parcours-1/
│   │   │   └── test.spec.ts
│   │   └── parcours-2/
│   │       └── test.spec.ts
│   └── p3/
│       ├── parcours-1/
│       │   └── test.spec.ts
│       └── parcours-2/
│           └── test.spec.ts
├── gimp/
│   └── p1/
│       └── parcours-1/
│           └── test.spec.ts
└── ia-generative/
    └── p1/
        ├── parcours-word-ia/
        │   └── test.spec.ts
        └── parcours-excel-ia/
            └── test.spec.ts
```

## 📊 Test Matrix Complète

| Formation | Niveaux | Parcours | PDF Section | Statut |
|-----------|---------|----------|-------------|--------|
| **Anglais** | P1, P2 | 1, 2 | Usage de la langue | ✓ Setup |
| **Excel** | P1, P2, P3 | 1, 2 | Usage du logiciel | ✓ Setup |
| **Word** | P1, P2, P3 | 1, 2 | Usage du logiciel | ✓ Setup |
| **GIMP** | P1 | 1 | Usage du logiciel | ✓ Setup |
| **IA Générative** | P1 | word-ia, excel-ia | Usage du logiciel | ✓ Setup |

**Total**: 19 test combinations

## 🧪 Exécuter les Tests

### Tous les tests de formation
```bash
npx playwright test tests/formations/
```

### Une formation spécifique
```bash
npx playwright test tests/formations/anglais/
npx playwright test tests/formations/excel/
npx playwright test tests/formations/word/
```

### Un niveau spécifique
```bash
npx playwright test tests/formations/excel/p1/
npx playwright test tests/formations/excel/p2/
npx playwright test tests/formations/excel/p3/
```

### Un parcours spécifique
```bash
npx playwright test tests/formations/anglais/p1/parcours-1/
npx playwright test tests/formations/excel/p3/parcours-2/
```

### Avec UI (mode interactif)
```bash
npx playwright test tests/formations/ --ui
```

### Mode debug
```bash
npx playwright test tests/formations/excel/p1/parcours-1/ --debug
```

### Voir les résultats
```bash
npx playwright show-report
```

## ✅ Checklist de Test Manual

Pour chaque combinaison formation/niveau/parcours:

- [ ] Formation sélectionnable
- [ ] Session démarre ("Commencer" button)
- [ ] Questions répondables
- [ ] Progression possible
- [ ] Recommandations affichées
- [ ] PDF téléchargeable
- [ ] PDF contient la section attendue
- [ ] P3 override rules appliquées (si applicable)

## 📝 Exemples de Test

### Anglais P1 Parcours 1
```bash
npx playwright test tests/formations/anglais/p1/parcours-1/test.spec.ts
```
**Expected**:
- Formation: Anglais
- Niveau: P1
- PDF Section: "Usage de la langue"

### Excel P3 Parcours 2
```bash
npx playwright test tests/formations/excel/p3/parcours-2/test.spec.ts
```
**Expected**:
- Formation: Excel
- Niveau: P3
- P3 Override rules active
- PDF Section: "Usage du logiciel"

### IA Générique P1 Word+IA
```bash
npx playwright test tests/formations/ia-generative/p1/parcours-word-ia/test.spec.ts
```
**Expected**:
- Modal de choix s'affiche
- Option "Word + IA" sélectionnable
- PDF Section: "Usage du logiciel"

## 🔧 Ajouter de Nouveaux Tests

Pour ajouter un nouveau test à une combinaison:

1. Naviguer vers le répertoire approprié
2. Éditer ou créer `test.spec.ts`
3. Ajouter les étapes de test
4. Exécuter avec Playwright

Exemple:
```bash
cd tests/formations/anglais/p1/parcours-1/
# Éditer test.spec.ts
npx playwright test test.spec.ts
```

## 📊 Rapports d'Exécution

Après chaque exécution, Playwright génère un rapport HTML:
```bash
npx playwright show-report
```

Le rapport contient:
- ✓/✗ Statut de chaque test
- Durée d'exécution
- Screenshots (si activé)
- Traces de navigation
- Logs de console

## 🐛 Débogage

### Voir le navigateur pendant le test
```bash
npx playwright test tests/formations/excel/p1/parcours-1/ --debug
```

### Prendre des screenshots
Ajouter dans le test:
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Logs de console
Ajouter dans le test:
```typescript
console.log('Debug info:', await page.textContent('body'));
```

## 📋 Format de Test

Chaque `test.spec.ts` suit ce format:

```typescript
import { test } from '@playwright/test';

/**
 * Formation: XXX | Level: PX | Parcours: Y
 * Expected PDF Section: XXX
 */

test('FORMATION - LEVEL - Parcours Y', async ({ page, context }) => {
  // Navigation
  await page.goto('/formations');
  
  // Selection
  const formationLink = page.locator('...');
  await formationLink.click();
  
  // Session flow
  const startBtn = page.locator('button:has-text("Commencer")');
  await startBtn.click();
  
  // Answer questions
  // ...
  
  // Verify PDF
  // ...
  
  console.log('✓ Test completed');
});

export {};
```

## 🎯 Prochaines Étapes

- [ ] Exécuter tous les tests
- [ ] Identifier les formations/niveaux problématiques
- [ ] Corriger les issues
- [ ] Re-exécuter les tests échoués
- [ ] Générer le rapport final

---

**Structure créée**: 19 combinaisons test  
**Date**: 2026-07-10  
**Version**: 1.0
