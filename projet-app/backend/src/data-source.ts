import 'dotenv/config';
import { DataSource } from 'typeorm';

// Entities are loaded from compiled output (dist) when running migrations after build.
// The runner script builds the project then runs this file from dist, so paths
// refer to the compiled JS files.

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        // entities and migrations refer to compiled JS in dist when running runner after build
        entities: ["dist/**/*.entity.js"],
        migrations: ["dist/migrations/*.js"],
        synchronize: false,
        ssl: true,
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: +(process.env.DATABASE_PORT || 5432),
        username: process.env.DATABASE_USER || 'user',
        password: process.env.DATABASE_PASSWORD || 'password',
        database: process.env.DATABASE_NAME || 'wizzylearn',
        entities: ["dist/**/*.entity.js"],
        migrations: ["dist/migrations/*.js"],
        synchronize: false,
      },
);

export default AppDataSource;
