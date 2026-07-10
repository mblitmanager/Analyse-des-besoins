/**
 * Generate test matrix directly from database
 * 
 * Usage: node scripts/generate-test-matrix-db.js
 * Requires: PostgreSQL connection details in .env or environment
 */

const fs = require('fs');
const path = require('path');

// Database connection using direct SQL queries
async function connectDB() {
  // Try to load environment or use defaults
  const pgUser = process.env.DATABASE_USER || 'postgres';
  const pgPassword = process.env.DATABASE_PASSWORD || '';
  const pgHost = process.env.DATABASE_HOST || 'localhost';
  const pgPort = process.env.DATABASE_PORT || '5432';
  const pgDatabase = process.env.DATABASE_NAME || 'analyse_besoins';
  
  console.log(`Connecting to: ${pgHost}:${pgPort}/${pgDatabase}`);
  
  // Use direct psql via child_process for Windows compatibility
  const { execSync } = require('child_process');
  
  return {
    query: (sql) => {
      try {
        // Build psql command
        const connStr = pgPassword 
          ? `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`
          : `postgresql://${pgUser}@${pgHost}:${pgPort}/${pgDatabase}`;
        
        // Execute psql command
        const cmd = `psql "${connStr}" -c "${sql.replace(/"/g, '\\"')}" --json`;
        const result = execSync(cmd, { encoding: 'utf8' });
        
        if (result.trim().startsWith('[')) {
          return JSON.parse(result);
        }
        return [];
      } catch (err) {
        console.error('Query failed:', err.message);
        return [];
      }
    }
  };
}

async function generateMatrix() {
  console.log('=== Test Matrix Generation from Database ===\n');
  
  try {
    const db = await connectDB();
    
    // Query 1: Get all formations with levels
    console.log('Fetching formations and levels...');
    const formations = db.query(`
      SELECT 
        f.id,
        f.label,
        f.slug,
        f.category,
        f.enabled,
        f."enableP3ManualChoice",
        json_agg(json_build_object(
          'id', l.id,
          'label', l.label,
          'order', l."levelOrder"
        ) ORDER BY l."levelOrder") as levels
      FROM formations f
      LEFT JOIN levels l ON f.id = l."formationId"
      WHERE f.enabled = true
      GROUP BY f.id, f.label, f.slug, f.category
      ORDER BY f.label
    `);
    
    console.log(`Found ${formations.length} active formations\n`);
    
    // Query 2: Get all parcours rules
    console.log('Fetching parcours rules...');
    const parcours = db.query(`
      SELECT 
        id,
        "formationId",
        "formation1",
        "formation2",
        "parcoursTitle",
        "certification",
        "isActive"
      FROM parcours_rules
      WHERE "isActive" = true
      ORDER BY "formationId", "certification"
    `);
    
    console.log(`Found ${parcours.length} active parcours rules\n`);
    
    // Query 3: Get P3 override rules
    console.log('Fetching P3 override rules...');
    const p3Overrides = db.query(`
      SELECT 
        id,
        "formationId",
        "matchFormation",
        "formationLabel",
        "parcoursNumber",
        "certification"
      FROM p3_override_rules
      ORDER BY "formationId", "certification"
    `);
    
    console.log(`Found ${p3Overrides.length} P3 override rules\n`);
    
    // Build test matrix
    const testMatrix = [];
    let totalTests = 0;
    
    formations.forEach(formation => {
      const levels = formation.levels || [];
      const applicableRules = parcours.filter(r => r.formationId === formation.id);
      const p3Rules = p3Overrides.filter(r => r.formationId === formation.id);
      
      console.log(`\n📚 ${formation.label}`);
      console.log(`   Slug: ${formation.slug}`);
      console.log(`   Category: ${formation.category || 'N/A'}`);
      console.log(`   enableP3ManualChoice: ${formation.enableP3ManualChoice ? 'YES' : 'NO'}`);
      console.log(`   Levels: ${levels.length}`);
      
      if (levels.length === 0) {
        console.log(`   ⚠️  NO LEVELS CONFIGURED`);
        return;
      }
      
      levels.forEach(level => {
        const testCase = {
          id: `${formation.slug}-${level.order}`,
          formation: {
            id: formation.id,
            label: formation.label,
            slug: formation.slug,
            category: formation.category,
            enableP3ManualChoice: formation.enableP3ManualChoice,
          },
          level: {
            id: level.id,
            label: level.label,
            order: level.order,
          },
          expectedPdfSection: (formation.category === 'Langue' || formation.label.includes('anglais') || formation.label.includes('francais'))
            ? 'Usage de la langue'
            : 'Usage du logiciel',
          parcoursRules: applicableRules.length,
          p3OverrideRules: p3Rules.length,
          shouldHaveP3Override: p3Rules.length > 0 || applicableRules.length > 0,
        };
        
        testMatrix.push(testCase);
        
        console.log(`   ├─ P${level.order}: ${level.label}`);
        console.log(`   │  └─ Expected PDF: ${testCase.expectedPdfSection}`);
        if (testCase.parcoursRules > 0) {
          console.log(`   │  └─ Parcours rules: ${testCase.parcoursRules}`);
        }
        if (testCase.p3OverrideRules > 0) {
          console.log(`   │  └─ P3 override rules: ${testCase.p3OverrideRules}`);
        }
        
        totalTests++;
      });
    });
    
    // Summary
    console.log('\n\n=== TEST MATRIX SUMMARY ===\n');
    console.log(`Total formations: ${formations.length}`);
    console.log(`Total test scenarios: ${totalTests}`);
    console.log(`Total parcours rules: ${parcours.length}`);
    console.log(`Total P3 override rules: ${p3Overrides.length}`);
    
    // Group by category
    const byCategory = {};
    testMatrix.forEach(tc => {
      const cat = tc.formation.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(tc);
    });
    
    console.log('\nBy category:');
    Object.entries(byCategory).forEach(([cat, tests]) => {
      console.log(`  ${cat}: ${tests.length} tests`);
    });
    
    // IA Générative special note
    const iaTests = testMatrix.filter(t => t.formation.label.toLowerCase().includes('ia'));
    if (iaTests.length > 0) {
      console.log('\n⚠️  IA Générative tests (special handling):');
      iaTests.forEach(t => {
        console.log(`  ${t.formation.label} → P${t.level.order}`);
        console.log(`    Expected: Modal with Word+IA / Excel+IA options`);
      });
    }
    
    // Export as JSON
    const outputPath = path.join(__dirname, 'test-matrix-db.json');
    fs.writeFileSync(outputPath, JSON.stringify(testMatrix, null, 2));
    console.log(`\n✅ Test matrix exported to: ${outputPath}`);
    
    // Export as markdown
    const mdPath = path.join(__dirname, '../TEST_MATRIX_DETAILED.md');
    generateMarkdownReport(testMatrix, mdPath);
    console.log(`✅ Detailed report exported to: ${mdPath}`);
    
    return { formations: formations.length, tests: totalTests, matrix: testMatrix };
    
  } catch (err) {
    console.error('❌ Error generating matrix:', err.message);
    process.exit(1);
  }
}

function generateMarkdownReport(matrix, outputPath) {
  let md = '# Test Matrix Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Total Test Cases: ${matrix.length}\n\n`;
  
  // Group by formation
  const byFormation = {};
  matrix.forEach(tc => {
    const key = tc.formation.label;
    if (!byFormation[key]) byFormation[key] = [];
    byFormation[key].push(tc);
  });
  
  Object.entries(byFormation).forEach(([formation, tests]) => {
    md += `## ${formation}\n\n`;
    
    tests.forEach(tc => {
      md += `### Test: ${formation} → Level P${tc.level.order}\n\n`;
      md += `**Formation Details**:\n`;
      md += `- Label: ${tc.formation.label}\n`;
      md += `- Slug: ${tc.formation.slug}\n`;
      md += `- Category: ${tc.formation.category}\n`;
      md += `- P3 Manual Choice Enabled: ${tc.formation.enableP3ManualChoice ? 'Yes' : 'No'}\n\n`;
      
      md += `**Level Details**:\n`;
      md += `- Order: P${tc.level.order}\n\n`;
      
      md += `**Expected Behavior**:\n`;
      md += `- PDF Section: "${tc.expectedPdfSection}"\n`;
      md += `- P3 Override: ${tc.shouldHaveP3Override ? 'Yes' : 'No'}\n`;
      md += `- Parcours Rules: ${tc.parcoursRules}\n`;
      md += `- P3 Override Rules: ${tc.p3OverrideRules}\n\n`;
      
      md += `**Verification Steps**:\n`;
      md += `1. Create session for ${tc.formation.label}\n`;
      md += `2. Complete positionnement to reach Level P${tc.level.order}\n`;
      md += `3. Verify recommendations appear\n`;
      if (tc.shouldHaveP3Override) {
        md += `4. Verify P3 Override banner appears\n`;
      }
      md += `5. Download PDF\n`;
      md += `6. Verify PDF contains section: "${tc.expectedPdfSection}"\n\n`;
    });
  });
  
  fs.writeFileSync(outputPath, md);
}

// Run
generateMatrix()
  .then(result => {
    if (result) {
      console.log(`\n✅ Matrix generated: ${result.tests} tests for ${result.formations} formations`);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
