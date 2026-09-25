#!/bin/bash

# Script pour exécuter les tests Playwright complets avec captures d'écran
# et générer automatiquement la galerie visuelle

set -e

echo "🚀 Exécution des tests Playwright complets avec captures d'écran..."
echo ""

# Couleurs pour la sortie
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si Playwright est installé
if ! command -v npx &> /dev/null; then
    echo "❌ npx n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

# Créer les dossiers nécessaires
echo -e "${BLUE}📁 Création des dossiers...${NC}"
mkdir -p test-results/screenshots/{formations,admin,legal}
mkdir -p tests/comprehensive/{formations,admin,legal}

# Régénérer les tests si demandé
if [ "$1" == "--regenerate" ]; then
    echo -e "${YELLOW}🔄 Régénération des tests...${NC}"
    node generate-comprehensive-playwright-tests.js
fi

# Exécuter les tests
echo -e "${BLUE}🧪 Exécution des tests...${NC}"
if [ -z "$2" ]; then
    # Tous les tests
    npx playwright test tests/comprehensive/ --project=chromium
else
    # Catégorie spécifique
    npx playwright test tests/comprehensive/$2/ --project=chromium
fi

# Vérifier si les tests ont réussi
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests terminés avec succès!${NC}"
else
    echo -e "${YELLOW}⚠️ Tests terminés avec des erreurs. Vérifiez les rapports.${NC}"
fi

# Générer la galerie de captures
echo -e "${BLUE}🖼️ Génération de la galerie de captures...${NC}"
node generate-screenshot-gallery.js

# Ouvrir le rapport Playwright si disponible
if [ -f "playwright-report/index.html" ]; then
    echo -e "${GREEN}📊 Rapport Playwright disponible: playwright-report/index.html${NC}"
    echo -e "${GREEN}🖼️ Galerie de captures: SCREENSHOT_GALLERY.html${NC}"
    
    # Demander si l'utilisateur veut ouvrir les rapports
    read -p "Voulez-vous ouvrir les rapports dans le navigateur? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open SCREENSHOT_GALLERY.html
        elif command -v open &> /dev/null; then
            open SCREENSHOT_GALLERY.html
        else
            echo "Ouverture automatique non disponible. Ouvrez manuellement:"
            echo "  - Galerie: SCREENSHOT_GALLERY.html"
            echo "  - Rapport: playwright-report/index.html"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Aucun rapport Playwright disponible${NC}"
fi

echo ""
echo -e "${GREEN}✨ Processus terminé!${NC}"
echo ""
echo "📚 Commandes utiles:"
echo "  - Voir le rapport: npx playwright show-report"
echo "  - Régénérer les tests: bash run-comprehensive-tests.sh --regenerate"
echo "  - Tests formations uniquement: bash run-comprehensive-tests.sh '' formations"
echo "  - Tests admin uniquement: bash run-comprehensive-tests.sh '' admin"
echo "  - Tests légaux uniquement: bash run-comprehensive-tests.sh '' legal"