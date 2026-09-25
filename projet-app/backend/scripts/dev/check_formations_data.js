const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check values
    const res = await client.query('SELECT id, slug, label, "enableLowScoreWarning" FROM "formations"');
    console.log(JSON.stringify(res.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
