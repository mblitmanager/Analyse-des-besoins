const { Client } = require('pg');
require('dotenv').config();

async function log() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT f.label, COUNT(DISTINCT l.id) AS levels_count, COUNT(q.id) AS questions_count 
    FROM formations f 
    LEFT JOIN levels l ON l."formationId" = f.id 
    LEFT JOIN questions q ON q."levelId" = l.id AND q.type = 'positionnement' 
    WHERE f.id IN (40, 41, 42, 43, 49, 19, 20, 2) 
    GROUP BY f.label 
    ORDER BY f.label
  `);
  
  console.table(res.rows);
  await client.end();
}

log();
