const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkP3Format() {
  try {
    // Récupérer la règle Expertise Anglais
    const result = await pool.query(`
      SELECT "id", "parcoursTitle", "formation1", "formation2", "conditionP1", "conditionP2", "isActive"
      FROM "p3_override_rules"
      WHERE "parcoursTitle" ILIKE '%Expertise Anglais%'
    `);

    console.log('=== Règle Expertise Anglais ===');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Parcours Title: ${row.parcoursTitle}`);
        console.log(`Formation1 (P1): ${row.formation1}`);
        console.log(`Formation2 (P2): ${row.formation2}`);
        console.log(`Condition P1: ${row.conditionP1}`);
        console.log(`Condition P2: ${row.conditionP2}`);
        console.log(`Active: ${row.isActive}`);
        console.log('---');
      });
    } else {
      console.log('Aucune règle trouvée pour Expertise Anglais');
    }

    // Vérifier toutes les règles Anglais pour voir le format des P3
    const anglaisRules = await pool.query(`
      SELECT "id", "parcoursTitle", "formation1", "formation2", "conditionP1", "conditionP2"
      FROM "p3_override_rules"
      WHERE "formation" ILIKE '%Anglais%'
      ORDER BY "id"
    `);

    console.log('\n=== Toutes les règles Anglais ===');
    anglaisRules.rows.forEach(row => {
      console.log(`ID: ${row.id} | Parcours: ${row.parcoursTitle}`);
      console.log(`  P1: ${row.conditionP1 || row.formation1}`);
      console.log(`  P2: ${row.conditionP2 || row.formation2}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkP3Format();
