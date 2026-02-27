const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function diagnose() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  const excelRes = await client.query('SELECT * FROM questions WHERE "formationId" = (SELECT id FROM formations WHERE slug = \'excel\') LIMIT 1');
  console.log('--- EXCEL QUESTION SAMPLE ---');
  console.log(JSON.stringify(excelRes.rows[0], null, 2));

  const photoRes = await client.query('SELECT * FROM questions WHERE "formationId" = (SELECT id FROM formations WHERE slug = \'photoshop\') LIMIT 1');
  console.log('\n--- PHOTOSHOP QUESTION SAMPLE ---');
  console.log(JSON.stringify(photoRes.rows[0], null, 2));

  await client.end();
}

diagnose();
