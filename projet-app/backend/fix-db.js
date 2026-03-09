const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:wizzypsql@localhost:5432/wizzylearn3'
});

async function run() {
  try {
    await client.connect();
    
    // Check if it exists
    const res = await client.query("SELECT * FROM settings WHERE key = 'ENABLE_P3'");
    
    if (res.rows.length === 0) {
      // Insert if missing
      await client.query(
        "INSERT INTO settings (key, value, description) VALUES ($1, $2, $3)",
        ['ENABLE_P3', 'true', 'Activer/Désactiver le bouton Ajouter un autre parcours']
      );
      console.log("Successfully inserted ENABLE_P3");
    } else {
      console.log("ENABLE_P3 already exists");
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
