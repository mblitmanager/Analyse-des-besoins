import 'dotenv/config';
import { DataSource } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL;
const isSslRequired = databaseUrl?.includes('sslmode=require') || process.env.DB_SSL === 'true';

const dataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        synchronize: false,
        ...(isSslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: +(process.env.DATABASE_PORT || 5432),
        username: process.env.DATABASE_USER || 'user',
        password: process.env.DATABASE_PASSWORD || 'password',
        database: process.env.DATABASE_NAME || 'Wizilearn',
        synchronize: false,
      },
);

async function addP3OnlyColumn() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'formations' 
      AND column_name = 'p3Only'
    `;
    const result = await dataSource.query(checkQuery);
    
    if (result.length > 0) {
      console.log('Column p3Only already exists');
    } else {
      console.log('Adding p3Only column to formations table...');
      await dataSource.query(`
        ALTER TABLE "formations"
        ADD COLUMN "p3Only" boolean NOT NULL DEFAULT false
      `);
      console.log('Column p3Only added successfully');
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await dataSource.destroy();
    process.exit(1);
  }
}

addP3OnlyColumn();