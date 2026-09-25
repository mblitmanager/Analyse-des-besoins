const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2',
});

async function importRules() {
  try {
    const csvData = fs.readFileSync('../../regle parcours.csv', 'utf8');
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Check if table exists
    const res = await pool.query(`SELECT to_regclass('public.parcours_rules');`);
    if (!res.rows[0].to_regclass) {
      console.log('parcours_rules table does not exist yet. Exiting.');
      process.exit(1);
    }
    
    // Clear the table
    console.log('Clearing existing parcours_rules...');
    await pool.query('DELETE FROM parcours_rules');
    
    console.log(`Inserting ${lines.length} rules...`);
    
    let successCount = 0;
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 11) {
        console.warn('Skipping invalid line (less than 11 columns):', line);
        continue;
      }
      
      const id = parseInt(parts[0]);
      const formation = parts[1];
      const condition = parts[2] || '';
      const formation1 = parts[3] || '';
      const formation2 = parts[4] || '';
      const isActive = parts[5] === 'true';
      const reqPrereqFail = parts[6] === 'true';
      const order = parseFloat(parts[7] || '0');
      const certification = parts[8] || null;
      let prereqConds = null;
      try {
        if (parts[9] && parts[9] !== '[]') prereqConds = parts[9];
      } catch (e) {}
      const prereqLogic = parts[10] || 'OR';
      const formationId = parts[11] ? parseInt(parts[11].trim()) : null;
      
      await pool.query(`
        INSERT INTO parcours_rules 
        (id, formation, "formationId", condition, formation1, formation2, "isActive", "requirePrerequisiteFailure", "order", certification, "prerequisiteConditions", "prerequisiteLogic")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [id, formation, formationId, condition, formation1, formation2, isActive, reqPrereqFail, order, certification, prereqConds, prereqLogic]);
      
      successCount++;
    }
    
    console.log(`Successfully extracted and inserted ${successCount} rules.`);
    
    // Update the sequence sequence so future inserts don't conflict
    await pool.query(`SELECT setval(pg_get_serial_sequence('parcours_rules', 'id'), coalesce(max(id),0) + 1, false) FROM parcours_rules;`);
      
    console.log('Sequence updated.');
    process.exit(0);
  } catch (err) {
    console.error('Error importing dataset:', err);
    process.exit(1);
  }
}

importRules();
