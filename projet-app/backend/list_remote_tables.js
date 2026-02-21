const { Client } = require('pg');

const remoteUrl = 'postgresql://neondb_owner:npg_JtqZi0LxNnT1@ep-curly-fog-alozzg5e-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: remoteUrl,
  ssl: { rejectUnauthorized: false }
});

async function listRemoteTables() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('--- Tables sur la base Neon (Distant) ---');
    if (res.rows.length === 0) {
      console.log('Aucune table trouvée.');
    } else {
      res.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des tables distantes:', err);
  } finally {
    await client.end();
  }
}

listRemoteTables();
