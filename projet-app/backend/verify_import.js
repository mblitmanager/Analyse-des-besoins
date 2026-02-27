const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function verify() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  const query = `
    SELECT 
      f.slug, 
      l.label as level_label, 
      count(q.id) as total_qs, 
      count(q.id) FILTER (WHERE q."correctResponseIndex" >= 0) as with_correct,
      count(q.id) FILTER (WHERE q."correctResponseIndex" = -1) as missing_correct
    FROM formations f 
    JOIN levels l ON l."formationId" = f.id 
    JOIN questions q ON q."levelId" = l.id 
    WHERE f.slug IN ('photoshop', 'outlook', 'illustrator')
    GROUP BY f.slug, l.label, l.order 
    ORDER BY f.slug, l.order
  `;

  try {
    const res = await client.query(query);
    console.table(res.rows);

    // Detail for questions missing correct answers
    const missingRes = await client.query(`
      SELECT f.slug, l.label as level, q.text, q.options 
      FROM questions q
      JOIN levels l ON q."levelId" = l.id
      JOIN formations f ON l."formationId" = f.id
      WHERE q."correctResponseIndex" = -1 AND f.slug IN ('photoshop', 'outlook', 'illustrator')
    `);
    
    if (missingRes.rows.length > 0) {
      console.log('\n❌ Questions missing correct answers:');
      missingRes.rows.forEach(r => {
        console.log(`[${r.slug.toUpperCase()}][${r.level}] ${r.text.substring(0, 50)}... | Options: ${r.options.length}`);
      });
    }

  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    await client.end();
  }
}

verify();
