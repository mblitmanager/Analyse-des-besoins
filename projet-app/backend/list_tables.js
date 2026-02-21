const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
});

async function listTables() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('--- Tables actuelles dans la base de données ---');
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des tables:', err);
  } finally {
    await client.end();
  }
}

listTables();
