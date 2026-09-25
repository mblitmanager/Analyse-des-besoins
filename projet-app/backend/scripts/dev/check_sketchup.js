
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn3' });

async function checkSketchup() {
  await client.connect();
  try {
    const formations = await client.query("SELECT id, label, slug FROM formations WHERE label ILIKE '%sketchup%'");
    console.log('Formations:', formations.rows);

    for (const f of formations.rows) {
      console.log(`Checking ${f.label} (slug: ${f.slug}, id: ${f.id})`);
      const levels = await client.query('SELECT label, "order" FROM levels WHERE "formationId" = $1 ORDER BY "order"', [f.id]);
      console.log(`Levels for ${f.label}:`, levels.rows);

      const questions = await client.query('SELECT COUNT(*) FROM questions WHERE "formationId" = $1 AND type = \'positionnement\'', [f.id]);
      console.log(`Positioning questions for ${f.label}:`, questions.rows[0].count);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkSketchup();
