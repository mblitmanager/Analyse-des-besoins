const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkParcoursRules() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check table structure
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'parcours_rules'
      ORDER BY ordinal_position
    `);
    console.log('Table structure:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

checkParcoursRules();
