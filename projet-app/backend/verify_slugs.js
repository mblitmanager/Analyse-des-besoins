const { Client } = require('pg');
require('dotenv').config();

async function log() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT f.label, f.id, f.slug FROM formations f');
  console.log(res.rows);
  await client.end();
}
log();
