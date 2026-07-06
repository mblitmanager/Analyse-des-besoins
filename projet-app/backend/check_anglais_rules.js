const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkAnglaisRules() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // First, check what tables exist
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%parcours%'"
    );
    console.log('Parcours-related tables:', tablesRes.rows.map(r => r.table_name));
    
    // Then check English rules from the correct table
    const res = await client.query(
      'SELECT id, formation, "formationId", condition, formation1, formation2, "isActive", "parcoursTitle" FROM parcours_rules WHERE formation ILIKE $1 ORDER BY id',
      ['%anglais%']
    );
    
    console.log('Current English parcours rules in database:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
  }
}

checkAnglaisRules();
