const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkLevels() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check levels table structure
    const levelsRes = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'levels'
      ORDER BY ordinal_position
    `);
    console.log('Levels table structure:');
    console.log(JSON.stringify(levelsRes.rows, null, 2));
    
    // Check some levels data
    const levelsData = await client.query('SELECT * FROM levels LIMIT 10');
    console.log('\nSample levels data:');
    console.log(JSON.stringify(levelsData.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

checkLevels();
