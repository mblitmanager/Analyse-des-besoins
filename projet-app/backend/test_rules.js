const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'wizzylearn3'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");

    // Restore prerequisiteConditions for Rule 7
    // Based on screenshot: Q#470 (1 rép.), Q#477 (1 rép.), Q#2101 (1 rép.)
    const conditions = JSON.stringify([
      { questionId: 470, responseIndexes: [1] },
      { questionId: 477, responseIndexes: [1] },
      { questionId: 2101, responseIndexes: [1] }
    ]);
    
    await client.query(
      `UPDATE parcours_rules SET "prerequisiteConditions" = $1 WHERE id = 7`,
      [conditions]
    );
    console.log("Updated Rule 7 prerequisiteConditions");

    // Verify
    const check = await client.query(`SELECT id, "requirePrerequisiteFailure", "prerequisiteConditions" FROM parcours_rules WHERE id = 7`);
    console.log("Verification:", JSON.stringify(check.rows[0], null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
