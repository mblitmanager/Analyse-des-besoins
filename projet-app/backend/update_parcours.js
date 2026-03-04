const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  const formations = ['Word', 'Excel', 'PowerPoint', 'Outlook'];
  const fallbackF2 = 'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)';

  try {
    for (const f of formations) {
      console.log(`Processing ${f}...`);
      
      // 1. Rename <= Initial to = Initial
      await client.query(
        "UPDATE parcours_rules SET condition = 'Si résultat du test = Initial', \"order\" = 1 WHERE formation = $1 AND (condition = 'Si résultat du test <= Initial' OR condition = 'Si résultat du test < ou = à Initial')",
        [f]
      );

      // 2. Check if < à Initial already exists
      const res = await client.query(
        "SELECT id FROM parcours_rules WHERE formation = $1 AND condition = 'Si résultat du test < à Initial'",
        [f]
      );

      if (res.rows.length === 0) {
        // Add the new rule at order 0
        await client.query(
          'INSERT INTO parcours_rules (formation, condition, formation1, formation2, "order") VALUES ($1, $2, $3, $4, $5)',
          [
            f,
            'Si résultat du test < à Initial',
            'TOSA Digcomp Initial',
            fallbackF2,
            0
          ]
        );
        console.log(`  Added < à Initial rule for ${f}.`);
      } else {
        // Update existing < à Initial rule
        await client.query(
          'UPDATE parcours_rules SET formation1 = $2, formation2 = $3, "order" = 0 WHERE id = $1',
          [res.rows[0].id, 'TOSA Digcomp Initial', fallbackF2]
        );
        console.log(`  Updated < à Initial rule for ${f}.`);
      }
      
      // Re-order others just in case
      await client.query(
        "UPDATE parcours_rules SET \"order\" = \"order\" + 1 WHERE formation = $1 AND condition NOT IN ('Si résultat du test < à Initial', 'Si résultat du test = Initial') AND \"order\" <= 1",
        [f]
      );
    }

    // Special case for DigComp
    console.log('Processing DigComp...');
    await client.query(
      "UPDATE parcours_rules SET condition = 'Si résultat du test < à Initial', formation1 = 'TOSA Digcomp Initial', formation2 = $1 WHERE formation = 'DigComp' AND (condition = 'Si résultat du test < Initial' OR condition = 'Si résultat du test < à Initial')",
      [fallbackF2]
    );
    console.log('  Updated DigComp rules.');

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
