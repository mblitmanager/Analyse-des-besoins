const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const parsedTestsDir = path.resolve(__dirname, '..', 'parsed_tests');
const file = 'Voltaire - Test AB.md';

const mapping = { slug: 'voltaire', label: 'Français', category: 'Langue', id: 2 };

function parseVoltaire(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const levels = [];
  let currentLevel = null;
  let currentQuestion = null;
  let levelOrder = 1;
  let qOrder = 1;

  let commonPrefix = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const upperLine = line.toUpperCase();
    
    // Match levels
    if (upperLine.includes('__DÉCOUVERTE__') || upperLine.includes('__TECHNIQUE__') || 
        upperLine.includes('__PROFESSIONNEL__') || upperLine.includes('__AFFAIRES__')) {
      
      let lvlName = 'Découverte';
      if (upperLine.includes('TECHNIQUE')) lvlName = 'Technique';
      if (upperLine.includes('PROFESSIONNEL')) lvlName = 'Professionnel';
      if (upperLine.includes('AFFAIRES')) lvlName = 'Affaires';

      currentLevel = {
        label: lvlName,
        order: levelOrder++,
        successThreshold: 80,
        questions: []
      };
      levels.push(currentLevel);
      qOrder = 1;
      commonPrefix = ""; // Reset common prefix on new level
      continue;
    }

    // Match common prefix like "Les phrases ci-dessous sont-elles correctes ou incorrectes :"
    if (line.includes('Les phrases ci\\-dessous sont\\-elles correctes ou incorrectes :')) {
      commonPrefix = "Les phrases ci-dessous sont-elles correctes ou incorrectes : ";
      continue;
    }

    // Match question starts: # <a id="..."></a> text
    if (line.startsWith('# <a id="')) {
      let qText = line.replace(/# <a id="[^"]+"><\/a>/, '').trim();
      
      // If the line is just the anchor with no text, skip it or wait for next line?
      if (!qText && lines[i+1] && lines[i+1].trim() === '') {
         // skip empty anchor
         continue;
      }
      
      // Sometimes it's empty, but next line has the text? Wait, in the markdown, it looks like:
      // # <a id="..."></a>« Il ne faut pas ... »
      if (qText) {
         if (qText.includes('Les phrases ci\\-dessous')) {
             commonPrefix = "Les phrases ci-dessous sont-elles correctes ou incorrectes : ";
             continue;
         }
         
         qText = qText.replace(/\\-/g, '-').replace(/\\\./g, '.').trim();
         
         // Fix special cases if it's a sub-question
         if (commonPrefix && qText.startsWith('«')) {
             qText = commonPrefix + qText;
         }

         currentQuestion = {
            text: qText,
            options: [],
            correctResponseIndex: -1,
            order: qOrder++
         };
         if (currentLevel) currentLevel.questions.push(currentQuestion);
      }
      continue;
    }

    // Match options (e.g. "- A\. ...", "- B. ")
    if (line.match(/^- [A-Z]\\?\.\s*/)) {
      if (currentQuestion) {
        let optText = line.replace(/^- [A-Z]\\?\.\s*/, '').trim();
        let isCorrect = false;
        
        if (optText.includes('✅') || optText.includes('✔️') || line.includes('__') || line.includes('**')) {
            isCorrect = true;
        }

        // Clean option text
        optText = optText.replace(/✅/g, '').replace(/✔️/g, '').replace(/__/g, '').replace(/\*\*/g, '').trim();

        currentQuestion.options.push(optText);
        if (isCorrect) {
          currentQuestion.correctResponseIndex = currentQuestion.options.length - 1;
        }
      }
    }
  }

  // Filter out any questions that have 0 options (like empty anchors)
  levels.forEach(l => {
     l.questions = l.questions.filter(q => q.options.length > 0);
  });

  return levels;
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to DB');

  console.log(`\n==========================================`);
  console.log(`Processing test: ${mapping.label} (Voltaire)`);
  console.log(`==========================================`);

  const formRes = await client.query(`SELECT id FROM formations WHERE slug = $1`, [mapping.slug]);
  let formationId;

  if (formRes.rows.length === 0) {
    console.log(`   ➕ Formation not found, creating ${mapping.label} (id: ${mapping.id})...`);
    await client.query(
      `INSERT INTO formations (id, slug, label, category, "isActive") VALUES ($1, $2, $3, $4, $5)`,
      [mapping.id, mapping.slug, mapping.label, mapping.category, true]
    );
    formationId = mapping.id;
  } else {
    formationId = formRes.rows[0].id;
    console.log(`   📚 Found formation ${mapping.label} (ID: ${formationId})`);
  }

  const filePath = path.join(parsedTestsDir, file);
  const levels = parseVoltaire(filePath);

  await client.query(`DELETE FROM questions WHERE type = 'positionnement' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)`, [formationId]);
  await client.query(`DELETE FROM levels WHERE "formationId" = $1`, [formationId]);

  for (const lvl of levels) {
    const recLabel = `Niveau ${lvl.label} - Formation ${mapping.label} recommandée`;
    const lvlRes = await client.query(
      `INSERT INTO levels (label, "order", "successThreshold", "recommendationLabel", "formationId")
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [lvl.label, lvl.order, lvl.successThreshold, recLabel, formationId]
    );
    const levelId = lvlRes.rows[0].id;
    console.log(`      📊 Level ${lvl.label} created (id=${levelId})`);

    for (const q of lvl.questions) {
      let correctResponseIndex = q.correctResponseIndex;
      if (correctResponseIndex === -1 && q.options.length > 0) {
          correctResponseIndex = 0;
          console.log(`         ⚠️ Warning: No correct response detected for Q: "${q.text.substring(0,30)}...", defaulting to index 0.`);
      }

      await client.query(
        `INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, "levelId", "formationId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [q.text, JSON.stringify(q.options), correctResponseIndex, q.order, true, 'positionnement', levelId, formationId]
      );
    }
    console.log(`         ➕ Inserted ${lvl.questions.length} questions for Level ${lvl.label}`);
  }

  await client.end();
  console.log('✅ Finished processing Voltaire');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
