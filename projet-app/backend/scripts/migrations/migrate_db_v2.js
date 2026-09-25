const { Client } = require('pg');

const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'Wizilearn',
  password: 'root', // I noticed earlier it was 'root' in my scripts, but .env had 'Test'. Using 'root' based on previous success.
  port: 5432,
};

const remoteUrl = 'postgresql://neondb_owner:npg_JtqZi0LxNnT1@ep-curly-fog-alozzg5e-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  const local = new Client(localConfig);
  const remote = new Client({ connectionString: remoteUrl, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Connexion aux bases...');
    await local.connect();
    console.log('Local connecté.');
    await remote.connect();
    console.log('Distant connecté.');

    const tables = ['users', 'formations', 'levels', 'questions', 'stagiaires', 'sessions', 'contacts', 'settings', 'workflow_steps'];

    for (const table of tables) {
      console.log(`Syncing ${table}...`);
      
      // Get data
      const res = await local.query(`SELECT * FROM ${table}`);
      console.log(`  Read ${res.rows.length} rows.`);

      if (res.rows.length > 0) {
        // We assume tables are created by TypeORM if we let it run, but if not we might need to create them.
        // For now, let's try to insert. 
        // We'll use a transaction for each table
        await remote.query('BEGIN');
        try {
          // Truncate remote
          await remote.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
          
          for (const row of res.rows) {
            const keys = Object.keys(row);
            const values = Object.values(row);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
            const cols = keys.join(',');
            await remote.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
          }
          await remote.query('COMMIT');
          console.log(`  ${table} synced.`);
        } catch (e) {
          await remote.query('ROLLBACK');
          console.error(`  Failed to sync ${table}:`, e.message);
        }
      }
    }
    console.log('Migration finished.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await local.end();
    await remote.end();
  }
}

migrate();
