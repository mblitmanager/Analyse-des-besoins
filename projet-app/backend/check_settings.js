
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn3';

async function checkSettings() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query("SELECT key, value FROM settings WHERE key LIKE 'AUTO_SKIP_%'");
        console.log(`Found ${res.rowCount} skip settings.`);
        res.rows.forEach(row => console.log(`${row.key}: ${row.value}`));

    } catch (err) {
        console.error('Error checking settings:', err);
    } finally {
        await client.end();
    }
}

checkSettings();
