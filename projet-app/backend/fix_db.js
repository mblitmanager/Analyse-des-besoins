
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn3';

async function fixDatabase() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Update SCORE rules to 'mise_a_niveau'
        const res1 = await client.query("UPDATE question_rules SET workflow = 'mise_a_niveau' WHERE workflow IS NULL AND \"ruleType\" = 'SCORE'");
        console.log(`Updated ${res1.rowCount} SCORE rules.`);

        // 2. Update QUESTION rules for known prerequis IDs
        const prerequisIds = [470, 473, 474, 477, 2109, 2415, 2416, 2417, 2418, 2419, 2420, 2421];
        const res2 = await client.query(`UPDATE question_rules SET workflow = 'prerequis' WHERE workflow IS NULL AND "ruleType" = 'QUESTION' AND "questionId" IN (${prerequisIds.join(',')})`);
        console.log(`Updated ${res2.rowCount} prerequis question rules.`);

        // 3. Update remaining NULLs to 'positionnement' or 'mise_a_niveau'
        const res3 = await client.query("UPDATE question_rules SET workflow = 'positionnement' WHERE workflow IS NULL AND \"ruleType\" = 'QUESTION'");
        console.log(`Updated ${res3.rowCount} remaining question rules to positionnement.`);
        
        const res4 = await client.query("UPDATE question_rules SET workflow = 'mise_a_niveau' WHERE workflow IS NULL");
        console.log(`Updated ${res4.rowCount} last NULL entries to mise_a_niveau.`);

        console.log('Database fix complete.');
    } catch (err) {
        console.error('Error fixing database:', err);
    } finally {
        await client.end();
    }
}

fixDatabase();
