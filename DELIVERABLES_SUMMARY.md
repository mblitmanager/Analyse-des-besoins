# 📦 Livrables - Extraction et Tests Playwright

**Date** : 24 septembre 2026  
**Source** : Base de données PostgreSQL `wizzylearn`  
**URL test** : https://ns-conseil-ab.mbl-service.com

---

## 📊 1. Fichiers Données Extraits

### A. Format JSON
**Fichier** : `extracted_db_data.json` (63 KB)

Contient :
- 19 formations détaillées
- 88 niveaux avec seuils de réussite
- 40 règles de parcours (parcours rules)
- 22 règles P3 filter
- Structures organisées par :
  - Formations par niveau
  - Parcours par formation
  - P3 possibles par formation:niveau

**Localisation** : `/var/www/Analyse-v2/extracted_db_data.json`

### B. Format Excel
**Fichier** : `parcours_formations_db.xlsx` (18 KB)

6 feuilles de calcul :
1. **Formations** - 19 lignes (ID, Label, Slug, Catégorie, Certificateur)
2. **Niveaux** - 88 lignes (ID, Libellé, Ordre, Seuil, Formation)
3. **Parcours Rules** - 40 lignes (ID, Formation, Condition, Formation1, Formation2)
4. **P3 Filter Rules** - 22 lignes (Nom, Mode Filter, Source, Cible)
5. **Résumé** - Statistiques et métadonnées
6. **Formations x Niveaux** - Vue synthétique avec liste des niveaux par formation

**Localisation** : `/var/www/Analyse-v2/parcours_formations_db.xlsx`

### C. Documentation Markdown
**Fichier** : Guide complet avec :
- Formations par catégorie
- Niveaux disponibles
- Parcours et trajectoires
- Règles P3 filter
- Informations certificateurs

---

## 🎭 2. Tests Playwright Générés

### A. Statistiques
- **Total tests générés** : 171
- **Formations couvertes** : 19
- **Niveaux couverts** : 88
- **Parcours testés** : 40 variations

### B. Structure
```
projet-app/frontend/generated-tests/
├── README.md
└── formations/
    ├── anglais/ (15 tests)
    ├── excel/ (6 tests)
    ├── word/ (5 tests)
    ├── photoshop/ (6 tests)
    ├── digitales-comptences/ (10 tests)
    ├── excel-ia/ (6 tests)
    ├── word-ia/ (6 tests)
    ├── francais/ (4 tests)
    ├── gimp/ (4 tests)
    ├── google-docs/ (4 tests)
    ├── google-sheets/ (4 tests)
    ├── google-slides/ (4 tests)
    ├── illustrator/ (4 tests)
    ├── mixte-microsoft-office/ (6 tests)
    ├── outils-collaboratifs-google/ (4 tests)
    ├── outlook/ (5 tests)
    ├── powerpoint/ (6 tests)
    ├── sketchup/ (4 tests)
    └── wordpress/ (4 tests)
```

### C. Flux de chaque test

```
1. Navigation vers https://ns-conseil-ab.mbl-service.com/formations
2. Sélection de la formation
3. Clique "Commencer"
4. Remplissage du questionnaire de positionnement
   - Sélectionne la première option de chaque question
   - Clique "Suivant" entre les questions
5. Clique "Terminer" pour voir les résultats
6. Capture d'écran : positionnement
7. Capture d'écran : résultats
```

### D. Lancer les tests

```bash
# Tous les tests
npx playwright test generated-tests/formations/

# Une formation spécifique
npx playwright test generated-tests/formations/anglais/

# Un niveau spécifique
npx playwright test generated-tests/formations/anglais/a2-consolider-les-bases/

# Un parcours spécifique
npx playwright test generated-tests/formations/anglais/a2-consolider-les-bases/parcours-1/

# Mode debug/headed
npx playwright test generated-tests/formations/ --debug
npx playwright test generated-tests/formations/ --headed

# Rapport HTML
npx playwright test generated-tests/formations/ --reporter=html
```

---

## 📂 Fichiers Générateurs

### A. Script Node.js pour Excel
**Fichier** : `projet-app/backend/extract_db_data.js`

- Requête PostgreSQL
- Agrégation des données
- Export Excel formaté
- Coloration des en-têtes

### B. Script de génération de tests
**Fichier** : `projet-app/backend/generate_playwright_tests.js`

- Requête PostgreSQL
- Génération dynamique des tests
- Structure hiérarchique
- Documentation automatique

---

## 📈 Répartition par Catégorie

### Bureautique Microsoft (28 tests)
- Word: 5
- Excel: 6
- PowerPoint: 6
- Outlook: 5
- Mixte Office: 6

### Google (16 tests)
- Google Docs: 4
- Google Sheets: 4
- Google Slides: 4
- Outils Collaboratifs: 4

### Création (18 tests)
- Photoshop: 6
- Illustrator: 4
- SketchUp: 4
- GIMP: 4

### Spécialisées (37 tests)
- Anglais: 15
- Digitales Compétences: 10
- Excel + IA: 6
- Word + IA: 6

### Autres (16 tests)
- Français: 4
- WordPress: 4

---

## 🔍 Données Extraites par Formation

### Formations Bureautique
| Formation | Niveaux | Seuils |
|-----------|---------|--------|
| Word | Initial, Basique, Opérationnel, Avancé, Expert | 3%, 4%, 4%, 5%, 4% |
| Excel | Initial, Basique, Opérationnel, Avancé, Expert | 3%, 4%, 4%, 4%, 4% |
| PowerPoint | Initial, Basique, Opérationnel, Avancé, Expert | 3%, 4%, 4%, 4%, 4% |
| Outlook | Initial, Basique, Opérationnel, Avancé, Expert | 3%, 4%, 4%, 4%, 5% |

### Formations Langues
| Formation | Niveaux |
|-----------|---------|
| Anglais | A1, A2, B1, B2, C1 |
| Français | Découverte, Technique, Professionnel, Affaires |

### Formations Création
| Formation | Niveaux |
|-----------|---------|
| Photoshop | Initial, Basique, Opérationnel, Avancé, Expert |
| Illustrator | Initial, Basique, Opérationnel |
| SketchUp | Initial, Basique, Opérationnel, Avancé |
| GIMP | Initial, Basique, Opérationnel, Avancé |

---

## 🛠️ Utilisation

### 1. Accéder aux données JSON
```bash
cat /var/www/Analyse-v2/extracted_db_data.json | jq '.structured.formationsParNiveau'
```

### 2. Ouvrir le fichier Excel
```bash
open /var/www/Analyse-v2/parcours_formations_db.xlsx
```

### 3. Lancer les tests
```bash
cd /var/www/Analyse-v2/projet-app/frontend
npx playwright test generated-tests/formations/ --reporter=html
```

### 4. Régénérer les données
```bash
cd /var/www/Analyse-v2/projet-app/backend
node extract_db_data.js          # Extraire données brutes
node export_to_xlsx.js            # Générer Excel
node generate_playwright_tests.js  # Générer tests
```

---

## 📌 Points Importants

✅ **Données actuelles** : Extraites directement de PostgreSQL (wizzylearn)
✅ **Tests reproductibles** : Chaque test utilise toujours la même formation/niveau
✅ **Documentation incluse** : Chaque test contient le contexte (seuil, parcours, formations)
✅ **Screenshots automatiques** : Avant et après résultats
✅ **URL configurable** : Facilement adaptable à d'autres environnements
✅ **Structure modulaire** : Tests indépendants, lancés individuellement ou par batch

---

## 📋 Checklist Livrables

- ✅ Extraction JSON (63 KB)
- ✅ Export Excel (18 KB) - 6 feuilles
- ✅ 171 tests Playwright générés
- ✅ Documentation complète
- ✅ Scripts de génération
- ✅ Résumé statistiques
- ✅ Guide d'utilisation

---

**Généré le** : 24 septembre 2026  
**Source code** : `generate_playwright_tests.js` + `export_to_xlsx.js`  
**Base de données** : wizzylearn (PostgreSQL)  
**URL test** : https://ns-conseil-ab.mbl-service.com
