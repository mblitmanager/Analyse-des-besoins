const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addP3Settings() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    const settings = [
      {
        key: 'P3_SAME_FORMATION_TEST',
        value: 'true',
        description: 'Autoriser les tests sur la même formation en mode P3'
      },
      {
        key: 'P3_OTHER_FORMATION_TEST',
        value: 'true',
        description: 'Exiger les tests sur une autre formation avant P3'
      }
    ];

    for (const setting of settings) {
      try {
        const query = `
          INSERT INTO settings (key, value, description) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (key) 
          DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description
        `;
        await client.query(query, [setting.key, setting.value, setting.description]);
        console.log(`✓ Setting ${setting.key} ajouté/mis à jour avec succès`);
      } catch (error) {
        console.error(`✗ Erreur pour ${setting.key}:`, error.message);
      }
    }
    
    await client.end();
    console.log('Terminé');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addP3Settings();
