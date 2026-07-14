const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Find column names for sessions to verify schema
    const cols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);
    const colNames = cols.rows.map(r => r.column_name);

    // Build query based on actual columns (camelCase vs snake_case)
    const isCompletedCol = colNames.includes('isCompleted') ? '"isCompleted"' : '"is_completed"';
    const isP3Col = colNames.includes('isP3Mode') ? '"isP3Mode"' : '"is_p3_mode"';
    const formationCol = colNames.includes('formationChoisie') ? '"formationChoisie"' : '"formation_choisie"';
    const recCol = colNames.includes('finalRecommendation') ? '"finalRecommendation"' : '"final_recommendation"';
    const stopCol = colNames.includes('stopLevel') ? '"stopLevel"' : '"stop_level"';
    const stagiaireCol = colNames.includes('stagiaireId') ? '"stagiaireId"' : '"stagiaire_id"';
    const createdCol = colNames.includes('createdAt') ? '"createdAt"' : '"created_at"';
    
    const sessions = await client.query(`
      SELECT s.id as session_id, s.${isCompletedCol} as is_completed, s.${isP3Col} as is_p3_mode, s.${formationCol} as formation_choisie, s.${recCol} as final_recommendation, s.${stopCol} as stop_level, s.${createdCol} as created_at,
             st.id as stagiaire_id, st.email, st.nom
      FROM sessions s
      LEFT JOIN stagiaires st ON s.${stagiaireCol} = st.id
      ORDER BY s.${createdCol} DESC
      LIMIT 10
    `);
    
    console.log('Recent sessions in DB:');
    console.log(JSON.stringify(sessions.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
  }
}

main();
