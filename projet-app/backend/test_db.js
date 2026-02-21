
const { Client } = require('pg');

async function test() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'wizzylearn',
    password: 'Test',
    port: 5432,
  });

  try {
    console.log('Attempting to connect to Local Postgres (postregs)...');
    await client.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Current Time:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
