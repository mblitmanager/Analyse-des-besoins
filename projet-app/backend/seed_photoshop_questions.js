const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seed() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const formationSlug = 'photoshop';
    const mdPath = path.join(__dirname, '..', 'parsed_tests', 'Photoshop-Test AB.md');

    if (!fs.existsSync(mdPath)) {
      console.error(`❌ File not found: ${mdPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(mdPath, 'utf-8');

    // 1. Find Photoshop formation
    const formRes = await client.query('SELECT id, label FROM formations WHERE slug = $1', [formationSlug]);
    if (formRes.rows.length === 0) {
      console.error(`❌ Formation not found: ${formationSlug}`);
      process.exit(1);
    }
    const formationId = formRes.rows[0].id;
    console.log(`📚 Found formation: ${formRes.rows[0].label} (ID: ${formationId})`);

    // 2. Clear old data
    console.log('🧹 Clearing old levels and questions for Photoshop...');
    await client.query('DELETE FROM questions WHERE type = \'positionnement\' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)', [formationId]);
    await client.query('DELETE FROM levels WHERE "formationId" = $1', [formationId]);

    // 3. Parse and Insert
    // Split by markdown headers or bold "Niveau" text
    const sections = content.split(/(?=##\s+|__Niveau\s+)/);
    let levelOrder = 1;

    for (let section of sections) {
      section = section.trim();
      if (!section) continue;

      const lines = section.split('\n');
      let firstLine = lines[0].trim();
      
      // Extract Level Label
      let levelLabel = firstLine
        .replace(/^##\s+/, '')
        .replace(/__|\*|\[|\]/g, '')
        .replace(/<a.*?>.*?<\/a>/g, '')
        .trim();
      
      // Ignore the main title of the document
      if (!levelLabel.toLowerCase().includes('niveau') || levelLabel.toLowerCase().includes('test de niveau')) {
          continue; 
      }

      console.log(`\n➡️ Processing level: ${levelLabel}`);
      
      const successThreshold = levelLabel.toLowerCase().includes('initial') ? 100 : 80;

      const levelInsert = await client.query(
        'INSERT INTO levels (label, "order", "successThreshold", "formationId") VALUES ($1, $2, $3, $4) RETURNING id',
        [levelLabel, levelOrder++, successThreshold, formationId]
      );
      const levelId = levelInsert.rows[0].id;

      // Extract questions
      const questionsData = [];
      let currentQuestion = null;

      lines.forEach(line => {
          line = line.trim();
          if (!line) return;

          // Robust question detection: must start with Q followed by digits
          const qMatch = line.match(/^(?:__\s*)?Q\d+.*?\.\s*(.*?)(?:__)?$/);
          
          if (qMatch && line.toLowerCase().includes('q') && line.match(/Q\d+/)) {
              if (currentQuestion) questionsData.push(currentQuestion);
              currentQuestion = {
                  text: qMatch[1].replace(/__/g, '').trim(),
                  options: [],
                  correct: -1
              };
              // console.log(`   [DEBUG] Found Question: ${currentQuestion.text}`);
          } else if (currentQuestion) {
              const optMatch = line.match(/^(?:__\s*)?([A-D])\.\s*(.*)/);
              if (optMatch) {
                  const optText = optMatch[2].replace(/✅|__/g, '').trim();
                  currentQuestion.options.push(optText);
                  if (line.includes('✅')) {
                      currentQuestion.correct = currentQuestion.options.length - 1;
                  }
                  // console.log(`   [DEBUG] Found Option ${optMatch[1]}: ${optText} ${line.includes('✅') ? '[CORRECT]' : ''}`);
              }
          }
      });
      if (currentQuestion) questionsData.push(currentQuestion);

      for (let i = 0; i < questionsData.length; i++) {
          const q = questionsData[i];
          if (q.correct === -1) {
              console.warn(`⚠️ Warning: No correct answer found for level "${levelLabel}" question: "${q.text.substring(0, 30)}..."`);
          }
          await client.query(
            'INSERT INTO questions (text, options, "correctResponseIndex", "order", type, "responseType", "levelId", "formationId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [q.text, JSON.stringify(q.options), q.correct, i + 1, 'positionnement', 'qcm', levelId, formationId]
          );
          console.log(`   ✅ Question ${i+1} inserted: ${q.text.substring(0, 50)}...`);
      }
    }

    console.log('\n✨ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
