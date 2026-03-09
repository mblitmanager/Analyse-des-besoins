
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn3' });

async function checkSketchupLevels() {
  await client.connect();
  try {
    const formation = await client.query("SELECT id, label FROM formations WHERE label ILIKE '%sketchup%'");
    if (formation.rows.length === 0) {
      console.log('No sketchup formation found');
      return;
    }
    const fId = formation.rows[0].id;
    console.log(`Formation: ${formation.rows[0].label} (ID: ${fId})`);

    const levels = await client.query('SELECT id, label FROM levels WHERE "formationId" = $1 ORDER BY "order"', [fId]);
    for (const l of levels.rows) {
      const qCount = await client.query('SELECT COUNT(*) FROM questions WHERE "levelId" = $1 AND type = \'positionnement\'', [l.id]);
      console.log(`Level: ${l.label} (ID: ${l.id}) - Questions: ${qCount.rows[0].count}`);
    }
    
    // Check questions without level
    const noLevelCount = await client.query('SELECT COUNT(*) FROM questions WHERE "formationId" = $1 AND "levelId" IS NULL AND type = \'positionnement\'', [fId]);
    console.log(`Questions with no level for Sketchup: ${noLevelCount.rows[0].count}`);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkSketchupLevels();
