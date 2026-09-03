const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkExpertiseAnglaisComplete() {
  try {
    // Récupérer la règle Expertise Anglais complète
    const result = await pool.query(`
      SELECT * FROM "p3_override_rules"
      WHERE "parcoursTitle" ILIKE '%Expertise Anglais%'
    `);

    console.log('=== Règle Expertise Anglais - Complète ===');
    if (result.rows.length > 0) {
      const row = result.rows[0];
      Object.keys(row).forEach(key => {
        console.log(`${key}: ${row[key]}`);
      });
    } else {
      console.log('Aucune règle trouvée pour Expertise Anglais');
    }

    // Vérifier s'il y a une colonne pour le résultat P3
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'p3_override_rules'
      ORDER BY ordinal_position
    `;
    
    const columns = await pool.query(columnsQuery);
    console.log('\n=== Colonnes de la table p3_override_rules ===');
    columns.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkExpertiseAnglaisComplete();
