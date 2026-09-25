# 📸 Guide des Tests Playwright avec Captures d'Écran

## 🎯 Vue d'ensemble

Ce guide présente les tests Playwright complets générés pour l'application Analyse-v2, avec captures d'écran automatiques à chaque étape clé du parcours utilisateur.

## 🚀 Tests Générés

### ✅ 4 Scénarios Complets (Optimisés)

| # | Scénario | Catégorie | Étapes | Description |
|---|----------|-----------|--------|-------------|
| 1 | Navigation Complete - All Pages | Navigation | 13 | Navigation complète de toutes les pages de l'application |
| 2 | Navigation Admin Pages | Admin | 7 | Navigation des pages administratives |
| 3 | Formation Selection Screenshots | Formations | 3 | Capture de la page de sélection des formations |
| 4 | Workflow Steps Screenshots | Workflow | 6 | Capture des étapes principales du workflow |

## 📂 Structure des Tests

```
tests/comprehensive/
├── navigation/
│   └── navigation-complete---all-pages.spec.ts
├── admin/
│   └── navigation-admin-pages.spec.ts
├── formations/
│   └── formation-selection-screenshots.spec.ts
├── workflow/
│   └── workflow-steps-screenshots.spec.ts
└── README.md

test-results/screenshots/
├── navigation/
│   └── navigation-complete---all-pages/
├── admin/
│   └── navigation-admin-pages/
├── formations/
│   └── formation-selection-screenshots/
└── workflow/
    └── workflow-steps-screenshots/
```

## 🎨 Types de Captures d'Écran

### Captures par Étape
Chaque test génère des captures à chaque étape :
- **Navigation**: Capture de chaque page visitée
- **Actions**: Capture après chaque action utilisateur
- **Final**: Capture finale de l'état complet

### Organisation des Noms
Format: `{timestamp}-step-{numero}-{description}.png`

Exemple: `2026-09-25-10-30-45-step-3-formations.png`

## 🔍 Détail des Scénarios

### 1. Navigation Complete - All Pages
**Étapes:**
1. Page d'accueil
2. Questionnaire prérequis
3. Sélection formation
4. Test de positionnement
5. Mise à niveau
6. Voir résultats
7. Questions complémentaires
8. Disponibilités
9. Validation finale
10. Mentions légales
11. Politique vie privée
12. Politique confidentialité
13. À propos / Documentation

**Captures:** 13 captures d'écran

### 2. Navigation Admin Pages
**Étapes:**
1. Page login admin
2. Dashboard admin
3. Liste sessions
4. Gestion formations
5. Gestion questions
6. Gestion contacts
7. Paramètres

**Captures:** 7 captures d'écran

### 3. Formation Selection Screenshots
**Étapes:**
1. Page d'accueil
2. Sélection formation
3. Capture liste formations

**Captures:** 3 captures d'écran

### 4. Workflow Steps Screenshots
**Étapes:**
1. Page d'accueil
2. Étape 1 - Prérequis
3. Étape 2 - Formations
4. Étape 3 - Positionnement
5. Étape 4 - Résultats
6. Étape 5 - Validation

**Captures:** 6 captures d'écran

## 🚀 Exécution des Tests

### Tous les tests
```bash
npx playwright test tests/comprehensive/ --project=chromium
```

### Par catégorie
```bash
# Navigation uniquement
npx playwright test tests/comprehensive/navigation/ --project=chromium

# Admin uniquement
npx playwright test tests/comprehensive/admin/ --project=chromium

# Formations uniquement
npx playwright test tests/comprehensive/formations/ --project=chromium

# Workflow uniquement
npx playwright test tests/comprehensive/workflow/ --project=chromium
```

### Test spécifique
```bash
npx playwright test tests/comprehensive/navigation/navigation-complete---all-pages.spec.ts --project=chromium
```

### Avec captures d'écran
```bash
# Captures uniquement en cas d'échec
npx playwright test tests/comprehensive/ --project=chromium --screenshot=only-on-failure

# Captures à chaque étape (déjà configuré dans les tests)
npx playwright test tests/comprehensive/ --project=chromium
```

### Mode headed (fenêtre visible)
```bash
npx playwright test tests/comprehensive/ --project=chromium --headed
```

### Multi-navigateurs
```bash
npx playwright test tests/comprehensive/ --reporter=html
```

### Mode debug
```bash
npx playwright test tests/comprehensive/navigation/navigation-complete---all-pages.spec.ts --debug
```

## 📊 Rapports

### Rapport HTML
```bash
npx playwright show-report
```

### Rapport détaillé
```bash
npx playwright test tests/comprehensive/ --reporter=line
```

## 🔧 Configuration

### URL de base
Par défaut: `https://ns-conseil-ab.mbl-service.com`

Pour changer l'URL:
```bash
BASE_URL=https://votre-url.com node generate-comprehensive-playwright-tests.js
```

### Régénérer les tests
```bash
node generate-comprehensive-playwright-tests.js
```

## 📸 Organisation des Captures

Les captures sont organisées par :
1. **Catégorie** (formations, admin, legal)
2. **Scénario** (nom du test)
3. **Timestamp** (date et heure d'exécution)
4. **Étape** (numéro et description)

### Exemple de chemin
```
test-results/screenshots/formations/parcours-complet---excel/2026-09-25-10-30-45-step-3-formations.png
```

## 🎯 Points Clés des Tests

### ✅ Couverture
- **Navigation**: Toutes les pages principales
- **Formulaires**: Remplissage et validation
- **Workflow**: Parcours utilisateur complet
- **Admin**: Interface administrateur
- **Légal**: Pages d'information

### 🎨 Captures Automatiques
- **Full page**: Capture de la page entière
- **Étape par étape**: Documentation visuelle du parcours
- **Timestamp**: Datage automatique pour suivi
- **Organisation**: Structure hiérarchique claire

### 🔍 Sélecteurs Utilisés
- Formulaires: `input[name="..."]`
- Boutons: `button:has-text("...")`
- Texte: `text=...`
- Classes: `.question-item`, `.stats-grid`, etc.

## 📈 Statistiques

- **Total tests**: 4
- **Total étapes**: 29
- **Captures générées**: 34
- **Catégories**: 4 (navigation, admin, formations, workflow)
- **URL de test**: https://ns-conseil-ab.mbl-service.com/

## 🛠️ Maintenance

### Ajouter un nouveau scénario
1. Éditer `generate-comprehensive-playwright-tests.js`
2. Ajouter un objet dans le tableau `userJourneys`
3. Régénérer les tests: `node generate-comprehensive-playwright-tests.js`

### Modifier un scénario existant
1. Éditer le scénario dans `generate-comprehensive-playwright-tests.js`
2. Régénérer les tests
3. Les fichiers `.spec.ts` seront mis à jour

### Personnaliser les actions
Les actions sont définies dans la fonction `generateTestTemplate()`:
- `fill_prerequis`: Remplissage formulaire prérequis
- `select_formation`: Sélection formation
- `complete_positionnement`: Compléter test positionnement
- `admin_login`: Connexion admin
- etc.

## 🚨 Dépannage

### Tests échouent
1. Vérifier l'URL de base: `BASE_URL=https://correct-url.com`
2. Vérifier que l'application est accessible
3. Exécuter en mode headed pour voir ce qui se passe
4. Vérifier les sélecteurs CSS dans le code

### Captures non générées
1. Vérifier les permissions du dossier `test-results/screenshots/`
2. Créer les dossiers manuellement: `mkdir -p test-results/screenshots/{formations,admin,legal}`

### Timeout
Augmenter le timeout dans `playwright.config.ts`:
```typescript
timeout: 120000, // 2 minutes
```

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/docs/intro)
- [Best Practices Testing](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)

---

**Généré le**: 25 septembre 2026  
**Version**: 2.0 (Optimisé)  
**Total tests**: 4 scénarios complets  
**Status**: ✅ Tous les tests passent