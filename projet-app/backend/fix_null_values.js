const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Update any NULL values to true
    const updateRes = await client.query('UPDATE "formations" SET "enableLowScoreWarning" = true WHERE "enableLowScoreWarning" IS NULL');
    console.log(`Updated ${updateRes.rowCount} formations with NULL enableLowScoreWarning.`);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
