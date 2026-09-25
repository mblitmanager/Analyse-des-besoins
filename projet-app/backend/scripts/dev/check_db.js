
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn3';

async function checkDatabase() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query("SELECT id, \"ruleType\", \"questionId\", workflow FROM question_rules WHERE workflow IS NULL");
        console.log(`Found ${res.rowCount} rows with NULL workflow.`);
        if (res.rowCount > 0) {
            console.log('Sample rows:', res.rows.slice(0, 5));
        }
        
        const count = await client.query("SELECT count(*) FROM question_rules");
        console.log(`Total rows in question_rules: ${count.rows[0].count}`);

    } catch (err) {
        console.error('Error checking database:', err);
    } finally {
        await client.end();
    }
}

checkDatabase();
