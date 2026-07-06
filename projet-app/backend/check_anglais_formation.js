const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAnglaisFormation() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check for Anglais formation
    const result = await client.query(`
      SELECT id, label FROM formations 
      WHERE label ILIKE '%anglais%' OR label ILIKE '%ANGLAIS%'
    `);
    
    console.log('Anglais formations found:', result.rows);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

checkAnglaisFormation();
