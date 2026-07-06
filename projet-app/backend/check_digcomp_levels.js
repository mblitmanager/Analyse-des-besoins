const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkDigcompLevels() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check DIGCOMP formation levels
    const levelsRes = await client.query(`
      SELECT id, label, "order", "successThreshold", "recommendationLabel", "isActive"
      FROM levels 
      WHERE "formationId" = 23
      ORDER BY "order"
    `);
    console.log('DIGCOMP Formation Levels:');
    console.log(JSON.stringify(levelsRes.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

checkDigcompLevels();
