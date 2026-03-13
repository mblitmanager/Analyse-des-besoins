const { Client } = require('pg');
const fs = require('fs');

async function dumpAllRules() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM parcours_rules ORDER BY id ASC');
    fs.writeFileSync('rules_full_dump.json', JSON.stringify(res.rows, null, 2));
    console.log('All rules written to rules_full_dump.json');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

dumpAllRules();
