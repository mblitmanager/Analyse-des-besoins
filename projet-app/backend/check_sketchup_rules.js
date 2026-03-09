
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn3' });

async function checkSketchupRules() {
  await client.connect();
  try {
    const res = await client.query("SELECT id, text, \"showIfQuestionId\", \"showIfRules\" FROM questions WHERE \"formationId\" = 21 AND type = 'positionnement'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkSketchupRules();
