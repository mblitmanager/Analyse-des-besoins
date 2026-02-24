
const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Test@localhost:5432/Wizilearn'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM contacts');
    console.log(`Found ${res.rows.length} contacts.`);
    res.rows.forEach(c => {
      console.log(`- ${c.prenom} ${c.nom} (Active: ${c.isActive})`);
    });
    await client.end();
  } catch (err) {
    console.error('❌ Error checking contacts:', err.message);
  }
}

check();
