const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkFrancaisFormation() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check for Français formation
    const result = await client.query(`
      SELECT id, label FROM formations 
      WHERE label ILIKE '%français%' OR label ILIKE '%FRANCAIS%' OR label ILIKE '%FRANÇAIS%'
    `);
    
    console.log('Français formations found:', result.rows);
    
    if (result.rows.length > 0) {
      const formationId = result.rows[0].id;
      
      // Check Français formation levels
      const levels = await client.query(`
        SELECT l.id, l.label, l."successThreshold", l."order"
        FROM levels l
        WHERE l."formationId" = $1
        ORDER BY l."order"
      `, [formationId]);
      
      console.log('Français levels found:', levels.rows);
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

checkFrancaisFormation();
