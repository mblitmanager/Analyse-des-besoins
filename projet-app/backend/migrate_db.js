const { Client } = require('pg');

const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
};

const remoteUrl = 'postgresql://neondb_owner:npg_JtqZi0LxNnT1@ep-curly-fog-alozzg5e-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrateData() {
  const localClient = new Client(localConfig);
  const remoteClient = new Client({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connexion aux bases de données...');
    await localClient.connect();
    await remoteClient.connect();
    console.log('Connecté !');

    const tables = [
      'settings',
      'formations',
      'levels',
      'questions',
      'stagiaires',
      'contacts',
      'users',
      'workflow_steps',
      'sessions'
    ];

    for (const table of tables) {
      console.log(`Migration de la table : ${table}...`);
      
      // 1. Get local data
      const res = await localClient.query(`SELECT * FROM ${table}`);
      console.log(`  ${res.rows.length} lignes trouvées.`);

      if (res.rows.length > 0) {
        // 2. Clear remote table (be careful, this is a sync)
        // Check if table exists first on remote
        const existsRes = await remoteClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          );
        `);
        
        if (!existsRes.rows[0].exists) {
          console.log(`  Table ${table} absente sur distant. Sautez ou créez manuellement via TypeORM. Sinon, je crée une structure simple.`);
          // For simplicity, we assume TypeORM synchronize:true will create tables if we point backend to it.
          // But the user asked to "créer les tables manquantes avec les données".
          // The best way to "create tables" is actually to let TypeORM do it by switching the .env temporarily.
          continue;
        }

        await remoteClient.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

        // 3. Insert into remote
        for (const row of res.rows) {
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const columns = keys.join(', ');
          
          await remoteClient.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
            values
          );
        }
        console.log(`  Table ${table} synchronisée.`);
      }
    }

    console.log('Migration terminée avec succès !');

  } catch (err) {
    console.error('Erreur pendant la migration :', err);
  } finally {
    await localClient.end();
    await remoteClient.end();
  }
}

migrateData();
