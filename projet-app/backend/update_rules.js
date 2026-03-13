const { Client } = require('pg');

async function updateRules() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2'
  });

  try {
    await client.connect();

    // 1. Update Rule 92 (AI) from = to ≤
    await client.query("UPDATE parcours_rules SET condition = 'Si résultat du test ≤ Initial' WHERE id = 92");
    console.log('Rule 92 updated.');

    // 2. Update Rule 75 (Digitales Compétences) from = to ≤
    await client.query("UPDATE parcours_rules SET condition = 'Si résultat du test ≤ Initial' WHERE id = 75");
    console.log('Rule 75 updated.');

    // 3. New Rule for Validated AI (just in case they validate it)
    // Checking if it already exists (unlikely given previous dump)
    const check93 = await client.query("SELECT * FROM parcours_rules WHERE formation = 'Intelligence Artificielle Générative' AND condition ILIKE '%>%'");
    if (check93.rows.length === 0) {
      await client.query(`
        INSERT INTO parcours_rules 
        ("formation", "condition", "formation1", "formation2", "isActive", "requirePrerequisiteFailure", "order", "formationId")
        VALUES 
        ('Intelligence Artificielle Générative', 'Si résultat du test > Initial', 'INKREA IA Advanced', '', true, false, 1, 24)
      `);
      console.log('Added validation rule for AI.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

updateRules();
