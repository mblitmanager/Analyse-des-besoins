const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Check if table exists
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'formations'");
    if (res.rows.length > 0) {
      console.log("Table 'formations' exists.");
      // Check columns
      const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'formations'");
      console.log("Columns:", cols.rows.map(r => r.column_name).join(", "));
      
      if (!cols.rows.some(r => r.column_name === 'enableLowScoreWarning')) {
        console.log("Adding column 'enableLowScoreWarning'...");
        await client.query('ALTER TABLE "formations" ADD COLUMN "enableLowScoreWarning" boolean NOT NULL DEFAULT true');
        console.log("Column added successfully.");
      } else {
        console.log("Column 'enableLowScoreWarning' already exists.");
      }
    } else {
      console.log("Table 'formations' DOES NOT exist.");
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
