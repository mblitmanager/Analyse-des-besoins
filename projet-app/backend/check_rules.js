const { Client } = require('pg');

async function checkRules() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2'
  });

  try {
    await client.connect();
    const levelsRes = await client.query('SELECT * FROM levels WHERE "formationId" = 24 ORDER BY "order" ASC');
    console.log('Levels (ID 24):', JSON.stringify(levelsRes.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkRules();
