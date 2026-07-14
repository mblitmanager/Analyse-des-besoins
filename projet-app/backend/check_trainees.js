const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Find column names for stagiaires
    const cols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stagiaires'
    `);
    console.log('Stagiaire columns:', cols.rows.map(r => r.column_name));

    const trainees = await client.query(`
      SELECT id, email, nom, prenom
      FROM stagiaires
      LIMIT 10
    `);
    console.log('Trainees in DB:');
    console.log(JSON.stringify(trainees.rows, null, 2));

    const sessionsWithStagiaire = await client.query(`
      SELECT id, "stagiaireId", "formationChoisie", "createdAt"
      FROM sessions
      WHERE "stagiaireId" IS NOT NULL
      LIMIT 10
    `);
    console.log('Sessions with stagiaireId not null:');
    console.log(JSON.stringify(sessionsWithStagiaire.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
  }
}

main();
