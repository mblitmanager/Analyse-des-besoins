/**
 * Test matrix generator: for each formation, level, and applicable parcours,
 * generates a test case to verify the recommendation logic works correctly.
 * 
 * Usage: node test-formations-matrix.js
 * Requires: Backend running on http://localhost:3001
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

async function fetchFormations() {
  try {
    const res = await fetch(`${API_BASE}/formations?activeOnly=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch formations:', err.message);
    return [];
  }
}

async function fetchParcoursRules() {
  try {
    const res = await fetch(`${API_BASE}/parcours?activeOnly=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch parcours rules:', err.message);
    return [];
  }
}

function normalizeLabel(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getApplicableParcoursRules(formation, rules) {
  if (!formation || !rules) return [];
  
  const formClean = normalizeLabel(formation.label);
  const formSlug = (formation.slug || '').toLowerCase();
  
  return rules.filter(rule => {
    const ruleFormClean = normalizeLabel(rule.formation);
    const ruleSlug = (rule.slug || '').toLowerCase();
    
    // Match by formation label or slug
    const matches = 
      (ruleFormClean && ruleFormClean === formClean) ||
      (ruleSlug && ruleSlug === formSlug) ||
      (rule.formationId && rule.formationId === formation.id);
    
    return matches && rule.isActive !== false;
  });
}

async function generateTestMatrix() {
  console.log('Fetching data from API...\n');
  
  const formations = await fetchFormations();
  const parcoursRules = await fetchParcoursRules();
  
  if (!formations || formations.length === 0) {
    console.error('No formations found. Ensure backend is running.');
    return;
  }
  
  console.log(`Found ${formations.length} formations\n`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let totalTestCases = 0;
  const testMatrix = [];
  
  formations.forEach(formation => {
    const levels = formation.levels || [];
    const applicable = getApplicableParcoursRules(formation, parcoursRules);
    
    if (levels.length === 0) {
      console.log(`⚠️  ${formation.label}: NO LEVELS CONFIGURED`);
      return;
    }
    
    console.log(`📚 FORMATION: ${formation.label}`);
    console.log(`   Slug: ${formation.slug}`);
    console.log(`   Category: ${formation.category || 'N/A'}`);
    console.log(`   Levels: ${levels.length}`);
    
    levels.forEach(level => {
      const testCase = {
        formation: formation.label,
        formationId: formation.id,
        formationSlug: formation.slug,
        formationCategory: formation.category,
        level: level.label,
        levelId: level.id,
        levelOrder: level.order,
        applicableParcours: applicable.map(r => ({
          id: r.id,
          title: r.parcoursTitle,
          formation1: r.formation1,
          formation2: r.formation2,
        })),
        levelTestCount: applicable.length || 1,
      };
      
      console.log(`   ├─ Level ${level.order}: ${level.label}`);
      
      if (applicable.length > 0) {
        applicable.forEach((rule, idx) => {
          console.log(`   │  └─ Parcours ${idx + 1}: ${rule.parcoursTitle || rule.formation1 || 'N/A'} / ${rule.formation2 || ''}`);
          totalTestCases++;
        });
      } else {
        console.log(`   │  └─ (No parcours rule configured for this level)`);
        totalTestCases++;
      }
      
      testMatrix.push(testCase);
    });
    
    console.log();
  });
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total test cases to execute: ${totalTestCases}\n`);
  
  // Summary by formation category
  const byCategory = {};
  testMatrix.forEach(tc => {
    const cat = tc.formationCategory || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(tc);
  });
  
  console.log('SUMMARY BY CATEGORY:\n');
  Object.entries(byCategory).forEach(([category, tests]) => {
    const totalLevels = tests.length;
    const totalParcours = tests.reduce((sum, t) => sum + t.levelTestCount, 0);
    console.log(`  ${category}: ${totalLevels} levels × ~${totalParcours} parcours configurations`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('TEST EXECUTION GUIDE:\n');
  console.log('For each test case (formation + level), simulate:');
  console.log('  1. Create a session with the formation');
  console.log('  2. Answer prerequisite questions');
  console.log('  3. Progress through levels in positionnement');
  console.log('  4. Verify recommendation matches expected parcours rule');
  console.log('  5. Download PDF and verify "Usage de la langue" / "Usage du logiciel" section\n');
  
  // Export test matrix as JSON for scripting
  const exportPath = './test-matrix.json';
  require('fs').writeFileSync(
    exportPath,
    JSON.stringify(testMatrix, null, 2),
    'utf8'
  );
  console.log(`✅ Test matrix exported to: ${exportPath}\n`);
  
  return { formations: formations.length, testCases: totalTestCases, byCategory };
}

generateTestMatrix()
  .then(result => {
    if (result) {
      console.log(`TOTALS: ${result.formations} formations, ${result.testCases} test scenarios`);
    }
  })
  .catch(err => console.error('Error:', err.message));
