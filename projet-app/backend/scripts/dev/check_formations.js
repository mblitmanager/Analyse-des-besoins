const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkFormations() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check formations
    const formationsRes = await client.query('SELECT id, slug, label, "isActive" FROM formations ORDER BY label');
    console.log('\nFormations:');
    console.log(JSON.stringify(formationsRes.rows, null, 2));
    
    // Check parcours rules with formation names
    const rulesRes = await client.query('SELECT DISTINCT formation FROM parcours_rules');
    console.log('\nParcours rule formations:');
    console.log(JSON.stringify(rulesRes.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

checkFormations();
