# 🖼️ Déploiement de la Galerie de Captures d'Écran

## ✅ Configuration Terminée

La galerie de captures d'écran est maintenant accessible via l'URL de production.

### 🔗 URL d'Accès

**Production:** `https://ns-conseil-ab.mbl-service.com/screenshots/SCREENSHOT_GALLERY.html`

**Local:** `http://localhost:8081/screenshots/SCREENSHOT_GALLERY.html`

### 📂 Structure des Fichiers

Les captures sont servies depuis le dossier public du frontend:
```
projet-app/frontend/public/screenshots/
├── SCREENSHOT_GALLERY.html          # Galerie HTML interactive
├── navigation/                      # Captures navigation
├── admin/                           # Captures admin
├── formations/                      # Captures formations
└── workflow/                        # Captures workflow
```

### 🔧 Configuration Nginx

Le fichier `nginx.conf` a été configuré pour servir le dossier `/screenshots`:
```nginx
location /screenshots {
  alias /usr/share/nginx/html/screenshots;
  autoindex off;
  add_header Cache-Control "public, max-age=3600";
}
```

### 🐳 Configuration Docker

Le `Dockerfile` frontend a été modifié pour inclure les captures:
```dockerfile
COPY public/screenshots /app/dist/screenshots
```

### 🚀 Mise à jour des Captures

Pour mettre à jour les captures après avoir exécuté les tests:

**Option 1: Script automatisé**
```bash
./update-screenshots.sh
```

**Option 2: Manuel**
```bash
# 1. Exécuter les tests
npx playwright test tests/comprehensive/ --project=chromium

# 2. Générer la galerie
node generate-screenshot-gallery.js

# 3. Copier dans public
cp SCREENSHOT_GALLERY.html projet-app/frontend/public/screenshots/
cp -r test-results/screenshots/* projet-app/frontend/public/screenshots/

# 4. Rebuild frontend
cd projet-app/frontend
npm run build

# 5. Redémarrer Docker
docker stop aopia_frontend
docker rm aopia_frontend
docker-compose build frontend
docker run -d --name aopia_frontend -p 8081:80 analyse-v2_frontend
```

### 📊 Statistiques Actuelles

- **Catégories:** 4 (navigation, admin, formations, workflow)
- **Scénarios:** 4
- **Captures:** 34
- **URL de test:** https://ns-conseil-ab.mbl-service.com/

### 🎯 Tests Playwright

Pour exécuter les tests:
```bash
# Tous les tests
npx playwright test tests/comprehensive/ --project=chromium

# Test spécifique
npx playwright test tests/comprehensive/navigation/navigation-complete---all-pages.spec.ts

# Avec rapport HTML
npx playwright test tests/comprehensive/ --project=chromium --reporter=html
```

### 📚 Documentation

- **Guide des tests:** `TESTS_SCREENSHOTS_GUIDE.md`
- **Rapport d'exécution:** `TESTS_SUMMARY.md`
- **Générateur:** `generate-comprehensive-playwright-tests.js`
- **Galerie:** `generate-screenshot-gallery.js`

### 🔐 Sécurité

- Les captures sont des fichiers statiques (PNG + HTML)
- Pas de données sensibles dans les captures
- Cache configuré à 1 heure
- Accès public (pas d'authentification requise)

### 📝 Notes

- Le container frontend tourne sur le port 8081 (hôte) → 80 (container)
- Nginx sert les fichiers statiques
- Les captures sont générées en mode headless Chromium
- Firefox et WebKit nécessitent des dépendances système supplémentaires

---

**Dernière mise à jour:** 25 septembre 2026
**Status:** ✅ Production Ready
