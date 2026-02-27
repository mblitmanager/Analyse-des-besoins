const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT f.label AS form_name, COUNT(DISTINCT l.id) AS levels_count, COUNT(q.id) AS questions_count
    FROM formations f
    LEFT JOIN levels l ON l."formationId" = f.id
    LEFT JOIN questions q ON q."levelId" = l.id AND q.type = 'positionnement'
    WHERE f.slug IN ('google-docs', 'google-sheets', 'google-slides', 'outils-collaboratifs-google', 'pack-office-outlook', 'illustrator', 'photoshop', 'voltaire')
    GROUP BY f.label
    ORDER BY f.label
  `);

  const output = res.rows.map(r => `${r.form_name} | Levels: ${r.levels_count} | Questions: ${r.questions_count}`).join('\n');
  fs.writeFileSync('verify_output.txt', output, 'utf8');
  console.log('Saved to verify_output.txt');
  await client.end();
}

check();
