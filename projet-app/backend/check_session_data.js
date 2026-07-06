const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkSessionData() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Get recent completed sessions
    const sessions = await client.query(`
      SELECT id, "formationChoisie", "finalRecommendation", "parcoursTitle", "stopLevel", "isCompleted", "createdAt"
      FROM sessions
      WHERE "isCompleted" = true
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);
    
    console.log('\n=== RECENT COMPLETED SESSIONS ===');
    sessions.rows.forEach(session => {
      console.log(`\nSession ID: ${session.id}`);
      console.log(`Formation: ${session.formationChoisie}`);
      console.log(`Final Recommendation: ${session.finalRecommendation}`);
      console.log(`Parcours Title: ${session.parcoursTitle}`);
      console.log(`Stop Level: ${session.stopLevel}`);
      console.log(`Created: ${session.createdAt}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

checkSessionData();
