import { createConnection } from 'typeorm';

async function fix() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      url: 'postgresql://postgres:root@localhost:5432/wizzylearn',
    });
    console.log('Connected to database');

    const all = await connection.query(
      'SELECT id, "options", "showIfRules" FROM questions',
    );

    for (const q of all) {
      let changed = false;
      let currentOptions = q.options;
      let currentRules = q.showIfRules;

      const sanitize = (val: string) => {
        if (!val) return val;
        // Replace illegal escapes: \. \- \! \? \' \| \: \_
        // JSON only allows \" \\ \/ \b \f \n \r \t \uXXXX
        return val.replace(/\\([\.\-\!\?\'\| \:\_])/g, '$1');
      };

      try {
        if (currentOptions) JSON.parse(currentOptions);
      } catch (e) {
        console.warn(`ID ${q.id} (options) is malformed: ${e.message}`);
        console.log(`  Value: ${currentOptions}`);
        currentOptions = sanitize(currentOptions);
        try {
          JSON.parse(currentOptions);
          changed = true;
          console.log(`  -> Sanitized successfully`);
        } catch (e2) {
          console.error(
            `  -> Extraction failed even after sanitization: ${e2.message}`,
          );
        }
      }

      try {
        if (currentRules) JSON.parse(currentRules);
      } catch (e) {
        console.warn(`ID ${q.id} (showIfRules) is malformed: ${e.message}`);
        console.log(`  Value: ${currentRules}`);
        currentRules = sanitize(currentRules);
        try {
          JSON.parse(currentRules);
          changed = true;
          console.log(`  -> Sanitized successfully`);
        } catch (e2) {
          console.error(
            `  -> Extraction failed even after sanitization: ${e2.message}`,
          );
        }
      }

      if (changed) {
        await connection.query(
          'UPDATE questions SET options = $1, "showIfRules" = $2 WHERE id = $3',
          [currentOptions, currentRules, q.id],
        );
        console.log(`ID ${q.id} updated in DB.`);
      }
    }

    await connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

fix();
