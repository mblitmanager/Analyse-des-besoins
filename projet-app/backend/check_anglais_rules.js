const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAnglaisRules() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check all tables
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('All tables in database:', tablesRes.rows.map(r => r.table_name));
    
    // Check formations table for English
    if (tablesRes.rows.some(r => r.table_name === 'formations')) {
      const formationsRes = await client.query(
        "SELECT id, slug, label FROM formations WHERE label ILIKE $1 OR slug ILIKE $1 ORDER BY id",
        ['%anglais%']
      );
      console.log('English formations in database:');
      console.log(JSON.stringify(formationsRes.rows, null, 2));
    }
    
    // Check if parcours_rules table exists and get English rules
    if (tablesRes.rows.some(r => r.table_name === 'parcours_rules')) {
      const res = await client.query(
        'SELECT id, formation, "formationId", condition, formation1, formation2, "isActive", "parcoursTitle" FROM parcours_rules WHERE formation ILIKE $1 ORDER BY id',
        ['%anglais%']
      );
      console.log('Current English parcours rules in database:');
      console.log(JSON.stringify(res.rows, null, 2));
    } else {
      console.log('parcours_rules table does not exist');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
  }
}

checkAnglaisRules();
