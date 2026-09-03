const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function displayExpertiseAnglais() {
  try {
    console.log('='.repeat(80));
    console.log('RÈGLE EXPERTISE ANGLAIS - DONNÉES ACTUELLES');
    console.log('='.repeat(80));
    
    const result = await pool.query(`
      SELECT * FROM "p3_override_rules"
      WHERE "parcoursTitle" ILIKE '%Expertise Anglais%'
    `);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      
      console.log('\n📋 INFORMATIONS GÉNÉRALES');
      console.log('-'.repeat(80));
      console.log(`ID                    : ${row.id}`);
      console.log(`Formation             : ${row.formation}`);
      console.log(`Parcours Title         : ${row.parcoursTitle}`);
      console.log(`Active                : ${row.isActive}`);
      
      console.log('\n🎯 CONDITIONS P1 ET P2');
      console.log('-'.repeat(80));
      console.log(`Condition P1 (entrée)  : ${row.conditionP1}`);
      console.log(`Condition P2 (entrée)  : ${row.conditionP2}`);
      console.log(`Formation1            : ${row.formation1}`);
      console.log(`Formation2            : ${row.formation2}`);
      
      console.log('\n⚙️  CONFIGURATION');
      console.log('-'.repeat(80));
      console.log(`Require Test          : ${row.requireTest}`);
      console.log(`Force Choice          : ${row.forceChoice}`);
      console.log(`Hidden Result         : ${row.isHiddenResult}`);
      
      console.log('\n📝 AUTRES CHAMPS');
      console.log('-'.repeat(80));
      console.log(`Condition             : ${row.condition || '(vide)'}`);
      console.log(`Certification         : ${row.certification || '(vide)'}`);
      console.log(`Explanation Message   : ${row.explanationMessage || '(vide)'}`);
      console.log(`Test Formations       : ${row.testFormations || '(vide)'}`);
      
      console.log('\n' + '='.repeat(80));
      console.log('ANALYSE DU FORMAT P3');
      console.log('='.repeat(80));
      
      // Analyser le format actuel
      if (row.conditionP2) {
        console.log(`\nFormat actuel P2 : "${row.conditionP2}"`);
        
        if (row.conditionP2.includes('Niveau') && row.conditionP2.includes('TOEIC')) {
          console.log('⚠️  Format complet détecté : "Niveau X - TOEIC"');
          console.log('   Format souhaité selon votre demande : "X" (ex: "C1")');
          
          // Extraire juste le niveau
          const match = row.conditionP2.match(/Niveau ([A-C][12])/);
          if (match) {
            console.log(`   Niveau extrait : "${match[1]}"`);
          }
        } else {
          console.log('✅ Format court détecté');
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('RECOMMANDATION');
      console.log('='.repeat(80));
      console.log('Pour avoir P3 = "C1" au lieu de "Niveau C1 - TOEIC" :');
      console.log('Option 1: Modifier conditionP2 pour contenir seulement "C1"');
      console.log('Option 2: Ajouter un champ "p3Result" pour stocker "C1" séparément');
      console.log('Option 3: Utiliser une logique d\'extraction dans le code');
      
    } else {
      console.log('❌ Aucune règle trouvée pour Expertise Anglais');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

displayExpertiseAnglais();
