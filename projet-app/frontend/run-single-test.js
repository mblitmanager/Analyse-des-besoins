const { execSync } = require('child_process');
const path = require('path');

// Test une seule formation en premier pour vérifier
const testPath = './generated-tests/formations/anglais/a2-consolider-les-bases/parcours-1/';

console.log('🎭 Lancement d\'un test Playwright...\n');
console.log(`📁 Test : ${testPath}`);
console.log(`🌐 URL : https://ns-conseil-ab.mbl-service.com\n`);

try {
  // Lancer avec configuration spéciale pour tests externes
  execSync(`npx playwright test ${testPath} --headed --reporter=line`, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_TEST_BASE_URL: 'https://ns-conseil-ab.mbl-service.com'
    }
  });
  
  console.log('\n✅ Test lancé avec succès !');
} catch (error) {
  console.error('\n❌ Erreur lors du lancement du test');
  process.exit(1);
}
