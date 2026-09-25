
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn3';

async function checkQuestions() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query(`
            SELECT q.id, q.text, q.type, f.slug as formation_slug 
            FROM questions q 
            LEFT JOIN formations f ON q."formationId" = f.id 
            WHERE q.type = 'mise-a-niveau' OR q.type = 'mise_a_niveau'
        `);
        console.log(`Found ${res.rowCount} mise_a_niveau questions.`);
        console.log('Samples:', res.rows.slice(0, 10));

    } catch (err) {
        console.error('Error checking questions:', err);
    } finally {
        await client.end();
    }
}

checkQuestions();
