import { createConnection } from 'typeorm';

async function diagnose() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      url: 'postgresql://postgres:root@localhost:5432/wizzylearn',
    });
    console.log('Connected to database');

    const tables = ['questions', 'sessions'];

    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      const result = await connection.query(`SELECT * FROM ${table}`);
      for (const row of result) {
        for (const [key, value] of Object.entries(row)) {
          if (
            typeof value === 'string' &&
            (value.startsWith('[') || value.startsWith('{'))
          ) {
            try {
              JSON.parse(value);
            } catch (e) {
              console.error(
                `!!! JSON Error in ${table} ID ${row.id || row.uuid}: Column ${key}`,
              );
              console.error(`  Value: ${value}`);
              console.error(`  Error: ${e.message}`);
            }
          }
        }
      }
    }

    await connection.close();
  } catch (error) {
    console.error('Connection error:', error);
  }
}

diagnose();
