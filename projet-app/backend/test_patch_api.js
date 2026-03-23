const axios = require('axios');
const { Client } = require('pg');
require('dotenv').config();

const apiBaseUrl = 'http://localhost:3001';
const formationId = 20; // Photoshop from previous check

async function test() {
  try {
    console.log('Testing PATCH /formations/' + formationId);
    
    // Toggle to false
    await axios.patch(`${apiBaseUrl}/formations/${formationId}`, {
      enableLowScoreWarning: false
    });
    console.log('PATCH sent (false)');
    
    // Check DB
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    let res = await client.query('SELECT "enableLowScoreWarning" FROM "formations" WHERE id = $1', [formationId]);
    console.log('Value in DB after false:', res.rows[0].enableLowScoreWarning);
    
    // Toggle back to true
    await axios.patch(`${apiBaseUrl}/formations/${formationId}`, {
      enableLowScoreWarning: true
    });
    console.log('PATCH sent (true)');
    
    res = await client.query('SELECT "enableLowScoreWarning" FROM "formations" WHERE id = $1', [formationId]);
    console.log('Value in DB after true:', res.rows[0].enableLowScoreWarning);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
