const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAnglaisLevels() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check Anglais formation levels
    const result = await client.query(`
      SELECT l.id, l.label, l."successThreshold", l."order"
      FROM levels l
      JOIN formations f ON l."formationId" = f.id
      WHERE f.id = 25
      ORDER BY l."order"
    `);
    
    console.log('Anglais levels found:', result.rows);
    
    // Check parcours rules for Anglais
    const rules = await client.query(`
      SELECT * FROM parcours_rules
      WHERE "formationId" = 25
    `);
    
    console.log('Anglais parcours rules found:', rules.rows);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

checkAnglaisLevels();
