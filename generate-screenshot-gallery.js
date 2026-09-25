const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'test-results/screenshots');
const OUTPUT_FILE = path.join(__dirname, 'SCREENSHOT_GALLERY.html');

function generateGallery() {
  console.log('🖼️ Génération de la galerie de captures d\'écran...');
  
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    console.log('⚠️ Dossier de captures non trouvé, création du dossier...');
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  
  const categories = fs.readdirSync(SCREENSHOTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let galleryContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galerie de Captures d'Écran - Tests Playwright</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        .subtitle {
            color: #666;
            font-size: 1.1em;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            flex: 1;
            min-width: 150px;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .category {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .category-title {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .scenario {
            margin-bottom: 30px;
        }
        
        .scenario-title {
            color: #555;
            margin-bottom: 15px;
            font-size: 1.3em;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .screenshot-card {
            background: #f8f9fa;
            border-radius: 15px;
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .screenshot-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        }
        
        .screenshot-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            cursor: pointer;
        }
        
        .screenshot-info {
            padding: 15px;
        }
        
        .screenshot-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
            font-size: 0.9em;
        }
        
        .screenshot-meta {
            color: #666;
            font-size: 0.8em;
        }
        
        .no-screenshots {
            text-align: center;
            padding: 40px;
            color: #999;
            background: #f8f9fa;
            border-radius: 15px;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 90vh;
            border-radius: 10px;
        }
        
        .modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 30px;
            cursor: pointer;
            background: none;
            border: none;
        }
        
        .regenerate-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1em;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.3s;
        }
        
        .regenerate-btn:hover {
            transform: scale(1.05);
        }
        
        .timestamp {
            color: #999;
            font-size: 0.8em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🖼️ Galerie de Captures d'Écran</h1>
            <p class="subtitle">Tests Playwright - Analyse-v2 Application</p>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="total-categories">0</div>
                    <div class="stat-label">Catégories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="total-scenarios">0</div>
                    <div class="stat-label">Scénarios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="total-screenshots">0</div>
                    <div class="stat-label">Captures</div>
                </div>
            </div>
            <p class="timestamp">Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}</p>
            <button class="regenerate-btn" onclick="location.reload()">🔄 Régénérer la galerie</button>
        </header>
`;

  let totalScenarios = 0;
  let totalScreenshots = 0;

  categories.forEach(category => {
    const categoryPath = path.join(SCREENSHOTS_DIR, category);
    
    if (!fs.existsSync(categoryPath)) {
      galleryContent += `
        <div class="category">
            <h2 class="category-title">📁 ${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div class="no-screenshots">
                Catégorie vide - Exécutez les tests pour générer des captures
            </div>
        </div>
`;
      return;
    }
    
    const scenarios = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    galleryContent += `
        <div class="category">
            <h2 class="category-title">📁 ${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
`;

    scenarios.forEach(scenario => {
      totalScenarios++;
      const scenarioPath = path.join(categoryPath, scenario);
      const screenshots = fs.readdirSync(scenarioPath)
        .filter(file => file.endsWith('.png'))
        .sort();

      if (screenshots.length > 0) {
        galleryContent += `
            <div class="scenario">
                <h3 class="scenario-title">🎯 ${scenario.replace(/-/g, ' ')}</h3>
                <div class="screenshots-grid">
`;

        screenshots.forEach(screenshot => {
          totalScreenshots++;
          const screenshotPath = path.join(scenarioPath, screenshot);
          const relativePath = path.relative(__dirname, screenshotPath);
          
          galleryContent += `
                    <div class="screenshot-card">
                        <img src="${relativePath}" alt="${screenshot}" class="screenshot-image" onclick="openModal('${relativePath}')">
                        <div class="screenshot-info">
                            <div class="screenshot-name">${screenshot.replace('.png', '')}</div>
                            <div class="screenshot-meta">${screenshots.length} captures</div>
                        </div>
                    </div>
`;
        });

        galleryContent += `
                </div>
            </div>
`;
      } else {
        galleryContent += `
            <div class="scenario">
                <h3 class="scenario-title">🎯 ${scenario.replace(/-/g, ' ')}</h3>
                <div class="no-screenshots">
                    Aucune capture disponible pour ce scénario
                </div>
            </div>
`;
      }
    });

    galleryContent += `
        </div>
`;
  });

  galleryContent += `
    </div>
    
    <div class="modal" id="modal" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            <img src="" alt="Capture agrandie" class="modal-image" id="modal-image">
        </div>
    </div>
    
    <script>
        function openModal(imagePath) {
            const modal = document.getElementById('modal');
            const modalImage = document.getElementById('modal-image');
            modalImage.src = imagePath;
            modal.classList.add('active');
        }
        
        function closeModal() {
            const modal = document.getElementById('modal');
            modal.classList.remove('active');
        }
        
        // Update stats
        document.getElementById('total-categories').textContent = ${categories.length};
        document.getElementById('total-scenarios').textContent = ${totalScenarios};
        document.getElementById('total-screenshots').textContent = ${totalScreenshots};
        
        // Close modal on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>
`;

  fs.writeFileSync(OUTPUT_FILE, galleryContent);
  console.log('✅ Galerie générée:', OUTPUT_FILE);
  console.log('📊 Statistiques:');
  console.log(`   - Catégories: ${categories.length}`);
  console.log(`   - Scénarios: ${totalScenarios}`);
  console.log(`   - Captures: ${totalScreenshots}`);
  console.log(`🌐 Ouvrir dans le navigateur: file://${OUTPUT_FILE}`);
}

generateGallery();