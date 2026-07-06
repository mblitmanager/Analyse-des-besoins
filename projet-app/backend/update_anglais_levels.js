const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function updateAnglaisLevels() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Update Anglais level labels to simplified format
    const updates = [
      { id: 1, newLabel: 'Niveau A1' },
      { id: 2, newLabel: 'Niveau A2' },
      { id: 3, newLabel: 'Niveau B1' },
      { id: 4, newLabel: 'Niveau B2' },
      { id: 5, newLabel: 'Niveau C1' },
    ];
    
    for (const update of updates) {
      await client.query(`
        UPDATE levels 
        SET label = $1 
        WHERE id = $2
      `, [update.newLabel, update.id]);
      console.log(`✓ Updated level ${update.id} to "${update.newLabel}"`);
    }
    
    console.log('\n✓ Successfully updated all Anglais level labels');
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

updateAnglaisLevels();
