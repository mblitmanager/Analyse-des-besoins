const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const res = await pool.query('SELECT * FROM workflow_steps ORDER BY "order"');
    console.log('=== WORKFLOW STEPS ===');
    res.rows.forEach(row => {
      console.log(`Order: ${row.order} | Code: ${row.code} | Route: ${row.route} | Label: ${row.label} | Active: ${row.isActive}`);
    });
    
    // Also check current session status
    const sessionRes = await pool.query('SELECT id, "formationChoisie", "isCompleted", "isP3Mode", "parcoursNumber", "finalRecommendation" FROM sessions ORDER BY "createdAt" DESC LIMIT 5');
    console.log('\n=== LATEST SESSIONS ===');
    sessionRes.rows.forEach(row => {
      console.log(`ID: ${row.id} | Formation: ${row.formationChoisie} | Completed: ${row.isCompleted} | P3: ${row.isP3Mode} | ParcoursNum: ${row.parcoursNumber} | Rec: ${row.finalRecommendation}`);
    });
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

main();
