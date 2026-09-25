#!/bin/bash

# Script pour mettre à jour les captures d'écran et la galerie
# Usage: ./update-screenshots.sh

cd /var/www/Analyse-v2

echo "🚀 Exécution des tests Playwright avec captures d'écran..."
npx playwright test tests/comprehensive/ --project=chromium

echo "🖼️ Génération de la galerie de captures d'écran..."
node generate-screenshot-gallery.js

echo "📦 Copie des captures dans le dossier public..."
cp SCREENSHOT_GALLERY.html projet-app/frontend/public/screenshots/
cp -r test-results/screenshots/* projet-app/frontend/public/screenshots/

echo "🔨 Rebuild du frontend avec les nouvelles captures..."
cd projet-app/frontend
npm run build
cd ../..

echo "🐳 Rebuild et redémarrage du container Docker..."
docker stop aopia_frontend
docker rm aopia_frontend
docker-compose build frontend
docker run -d --name aopia_frontend -p 8081:80 analyse-v2_frontend

echo "✅ Terminé ! La galerie est accessible sur http://localhost:8081/screenshots/SCREENSHOT_GALLERY.html"
