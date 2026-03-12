const { Client } = require('pg');

async function checkRules() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM parcours_rules WHERE "isActive" = true');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRules();
