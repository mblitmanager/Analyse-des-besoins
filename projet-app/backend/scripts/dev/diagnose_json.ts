import { createConnection } from 'typeorm';

async function diagnose() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      url: 'postgresql://postgres:root@localhost:5432/wizzylearn',
    });
    console.log('Connected to database');

    const result = await connection.query(
      'SELECT id, text, "options", "showIfRules", "correctResponseIndexes" FROM questions',
    );

    console.log(`Found ${result.length} questions.`);

    for (const row of result) {
      try {
        if (row.options) JSON.parse(row.options);
        if (row.showIfRules) JSON.parse(row.showIfRules);
        if (row.correctResponseIndexes) JSON.parse(row.correctResponseIndexes);
      } catch (e) {
        console.error(`!!! JSON Error in Question ID ${row.id}:`);
        console.error(`  Text: ${row.text.substring(0, 50)}...`);
        console.error(`  Options: ${row.options}`);
        console.error(`  ShowIfRules: ${row.showIfRules}`);
        console.error(
          `  CorrectResponseIndexes: ${row.correctResponseIndexes}`,
        );
        console.error(`  Error: ${e.message}`);
      }
    }

    await connection.close();
  } catch (error) {
    console.error('Connection error:', error);
  }
}

diagnose();
