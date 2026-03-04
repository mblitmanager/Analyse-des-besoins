const { Client } = require('pg');

const connectionString = 'postgresql://postgres:root@localhost:5432/wizzylearn';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  const settings = [
    {
      key: 'HIGH_LEVEL_ALERT_FORMATIONS',
      value: 'Word,PowerPoint,Google Docs/Sheets/Slides,DigComp,Outlook',
      description: 'Formations triggering an alert if a high level is achieved.'
    },
    {
      key: 'HIGH_LEVEL_THRESHOLD_ORDER',
      value: '2',
      description: 'Minimum level order (e.g. 2 for Opérationnel) to trigger the high level alert.'
    }
  ];

  try {
    for (const s of settings) {
      console.log(`Upserting setting ${s.key}...`);
      await client.query(
        'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, description = $3',
        [s.key, s.value, s.description]
      );
    }
    console.log('Settings seeded successfully.');
  } catch (err) {
    console.error('Error seeding settings:', err);
  } finally {
    await client.end();
  }
}

run();
