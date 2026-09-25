const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'wizzylearn3'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");

    const res = await client.query(`SELECT * FROM settings`);
    console.log("All settings:", JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
