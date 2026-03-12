const { Client } = require('pg');

async function testRecommendation() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/wizzylearn2'
  });

  try {
    await client.connect();
    
    // Simulate what happens in SessionsService
    const formationChoisie = 'Intelligence Artificielle Générative';
    const stopLevel = null; // Assuming they passed the only level
    
    console.log('--- Testing with stopLevel: null ---');
    
    const formationRes = await client.query("SELECT * FROM formations WHERE label = $1 OR slug = $1", [formationChoisie]);
    const formation = formationRes.rows[0];
    const formId = formation.id;
    console.log('Formation ID:', formId);

    const levelsRes = await client.query('SELECT * FROM levels WHERE "formationId" = $1 AND "isActive" IS NOT FALSE ORDER BY "order" ASC', [formId]);
    const levels = levelsRes.rows;
    console.log('Levels:', levels.map(l => l.label));

    const rulesRes = await client.query('SELECT * FROM parcours_rules WHERE ("formationId" = $1 OR formation = $2) AND "isActive" = true ORDER BY "order" ASC', [formId, formationChoisie]);
    const activeRules = rulesRes.rows;
    console.log('Active Rules count:', activeRules.length);

    const cleanLabel = (l) => (l || '').replace(/^Niveau\s+/i, '').trim().toUpperCase();
    
    const stopIdx = levels.findIndex(l => cleanLabel(l.label) === cleanLabel(stopLevel));
    console.log('Stop Index:', stopIdx);

    for (const rule of activeRules) {
      console.log(`Evaluating Rule ${rule.id}: "${rule.condition}"`);
      const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
      if (condMatch) {
         const operator = condMatch[1].replace('<=', '≤').replace('>=', '≥');
         const targetStr = cleanLabel(condMatch[2]);
         let targetIdx = levels.findIndex(l => cleanLabel(l.label) === targetStr);
         console.log(`  Target: "${targetStr}", Target Index: ${targetIdx}, Operator: ${operator}`);
         
         let result = false;
         switch (operator) {
           case '=': result = (stopIdx === targetIdx); break;
           case '<': result = (stopIdx < targetIdx); break;
           case '≤': result = (stopIdx <= targetIdx); break;
           case '>': result = (stopIdx > targetIdx); break;
           case '≥': result = (stopIdx >= targetIdx); break;
         }
         console.log(`  Match Result: ${result}`);
         if (result) {
           console.log(`  MATCH! Rec: ${rule.formation1} & ${rule.formation2}`);
           break;
         }
      } else {
        console.log('  No condition match');
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

testRecommendation();
