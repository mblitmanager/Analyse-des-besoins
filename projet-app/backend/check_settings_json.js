
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn3';

async function checkSettings() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT key, value FROM settings WHERE key LIKE 'AUTO_SKIP_%'");
        const settings = {};
        res.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        console.log('---SETTINGS_START---');
        console.log(JSON.stringify(settings, null, 2));
        console.log('---SETTINGS_END---');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSettings();
