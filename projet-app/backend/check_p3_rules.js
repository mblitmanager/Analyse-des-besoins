const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function compareRules() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Get parcours rules
    const parcoursRules = await client.query(`
      SELECT formation, condition, formation1, formation2, "order", "parcoursTitle"
      FROM parcours_rules
      ORDER BY formation, "order"
    `);
    
    console.log('\n=== PARCOURS RULES ===');
    parcoursRules.rows.forEach(rule => {
      console.log(`${rule.formation} | ${rule.condition} | ${rule.parcoursTitle}`);
      console.log(`  -> ${rule.formation1} + ${rule.formation2}`);
    });
    
    // Get P3 override rules
    const p3Rules = await client.query(`
      SELECT formation, condition, formation1, formation2, "order", "parcoursTitle"
      FROM p3_override_rules
      ORDER BY formation, "order"
    `);
    
    console.log('\n=== P3 OVERRIDE RULES ===');
    p3Rules.rows.forEach(rule => {
      console.log(`${rule.formation} | ${rule.condition} | ${rule.parcoursTitle}`);
      console.log(`  -> ${rule.formation1} + ${rule.formation2}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

compareRules();
