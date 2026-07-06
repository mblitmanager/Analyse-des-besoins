const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAllThresholds() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Get all unique successThreshold values
    const thresholdsRes = await client.query(`
      SELECT DISTINCT "successThreshold", COUNT(*) as count
      FROM levels 
      GROUP BY "successThreshold"
      ORDER BY "successThreshold"
    `);
    console.log('Unique successThreshold values:');
    console.log(JSON.stringify(thresholdsRes.rows, null, 2));
    
    // Get all levels with their labels and thresholds
    const allLevels = await client.query(`
      SELECT label, "successThreshold", COUNT(*) as count
      FROM levels 
      GROUP BY label, "successThreshold"
      ORDER BY "successThreshold", label
    `);
    console.log('\nAll levels by label and threshold:');
    console.log(JSON.stringify(allLevels.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

checkAllThresholds();
