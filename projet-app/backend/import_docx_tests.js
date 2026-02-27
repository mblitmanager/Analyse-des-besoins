const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const parsedTestsDir = path.resolve(__dirname, '..', 'parsed_tests');
const files = fs.readdirSync(parsedTestsDir);

// Mapping to existing or new formations
const formationMapping = {
  'Google Docs - Test AB.md': { slug: 'google-docs', label: 'Google Docs', category: 'Internet', id: 40 },
  'Google Sheets - Test AB.md': { slug: 'google-sheets', label: 'Google Sheets', category: 'Internet', id: 41 },
  'Google Slides - Test AB.md': { slug: 'google-slides', label: 'Google Slides', category: 'Internet', id: 42 },
  'Outils Collaboratifs Google - Test AB.md': { slug: 'outils-collaboratifs-google', label: 'Outils Collaboratifs Google', category: 'Internet', id: 43 },
  'Outlook-Test AB.md': { slug: 'outlook', label: 'Outlook', category: 'Bureautique', id: 49 },
  'Illustrator-Test AB.md': { slug: 'illustrator', label: 'Illustrator', category: 'Création', id: 19 },
  'Photoshop-Test AB.md': { slug: 'photoshop', label: 'Photoshop', category: 'Création', id: 20 },
  'Voltaire - Test AB.md': { slug: 'voltaire', label: 'Français', category: 'Langue', id: 2 }
};

function parseMarkdownTest(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const levels = [];
  let currentLevel = null;
  let currentQuestion = null;
  let levelOrder = 1;
  let qOrder = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const upperLine = line.toUpperCase();
    if (upperLine === 'INITIAL' || upperLine === 'BASIQUE' || upperLine === 'OPÉRATIONNEL' || upperLine === 'AVANCE' || upperLine === 'EXPERT') {
      currentLevel = {
        label: upperLine === 'AVANCE' ? 'Avancé' : upperLine === 'OPÉRATIONNEL' ? 'Intermédiaire' : upperLine === 'INITIAL' ? 'Débutant' : upperLine === 'BASIQUE' ? 'Basique' : 'Expert',
        order: levelOrder++,
        successThreshold: 80,
        questions: []
      };
      levels.push(currentLevel);
      qOrder = 1;
      continue;
    }

    // Match question starts (e.g. "1. Qu'est-ce que...", "10. Comment...")
    if (line.match(/^[0-9]+\.\s+/) && currentLevel) {
      currentQuestion = {
        text: line.replace(/^[0-9]+\.\s+/, '').replace(/:$/, '').replace(/\s*✅\s*/, '').trim(),
        options: [],
        correctResponseIndex: -1,
        order: qOrder++
      };
      currentLevel.questions.push(currentQuestion);
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

  return levels;
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to DB');

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const mapping = formationMapping[file];
    if (!mapping) {
      console.log(`⚠️ No mapping found for ${file}`);
      continue;
    }

    console.log(`\n==========================================`);
    console.log(`Processing test: ${mapping.label}`);
    console.log(`==========================================`);

    // 1. Ensure formation exists
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

    // Parse Markdown
    const filePath = path.join(parsedTestsDir, file);
    const levels = parseMarkdownTest(filePath);

    // 2. Clear old placement questions and levels exactly as done in other seed scripts
    await client.query(`DELETE FROM questions WHERE type = 'positionnement' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)`, [formationId]);
    await client.query(`DELETE FROM levels WHERE "formationId" = $1`, [formationId]);

    // 3. Insert new levels and questions
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
        // Fallback for correctResponseIndex if not detected
        let correctResponseIndex = q.correctResponseIndex;
        if (correctResponseIndex === -1 && q.options.length > 0) {
            correctResponseIndex = 0; // fallback to 0
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
  }

  await client.end();
  console.log('✅ Finished processing all docx tests');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
