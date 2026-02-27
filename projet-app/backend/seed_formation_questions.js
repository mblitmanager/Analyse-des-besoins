const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const FORMATIONS_CONFIG = {
  photoshop: {
    slug: 'photoshop',
    fileName: 'Photoshop-Test AB.md',
    successThreshold: 80
  },
  outlook: {
    slug: 'outlook',
    fileName: 'Outlook-Test AB.md',
    successThreshold: 80
  },
  illustrator: {
    slug: 'illustrator',
    fileName: 'Illustrator-Test AB.md',
    successThreshold: 80
  }
};

async function seedFormation(targetKey) {
  const config = FORMATIONS_CONFIG[targetKey];
  if (!config) {
    console.error(`❌ Unknown formation: ${targetKey}`);
    return;
  }

  try {
    const mdPath = path.join(__dirname, '..', 'parsed_tests', config.fileName);
    if (!fs.existsSync(mdPath)) {
      console.error(`❌ File not found: ${mdPath}`);
      return;
    }

    const content = fs.readFileSync(mdPath, 'utf-8');

    // 1. Find formation
    const formRes = await client.query('SELECT id, label FROM formations WHERE slug = $1', [config.slug]);
    if (formRes.rows.length === 0) {
      console.error(`❌ Formation not found in DB with slug: ${config.slug}`);
      return;
    }
    const formationId = formRes.rows[0].id;
    console.log(`\n==================================================`);
    console.log(`📚 [${config.slug.toUpperCase()}] Formation: ${formRes.rows[0].label} (ID: ${formationId})`);
    console.log(`==================================================`);

    // 2. Clear old data
    console.log(`🧹 Clearing old levels and questions...`);
    await client.query('DELETE FROM questions WHERE type = \'positionnement\' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)', [formationId]);
    await client.query('DELETE FROM levels WHERE "formationId" = $1', [formationId]);

    // 3. Parse Sections (Levels)
    // Split by headers or bold level words at the start of a line
    const sections = content.split(/\n(?=#{1,3}\s+|__Niveau|__Initial|__Basique|__Opérationnel|__Avancé|__Expert)/i);
    let levelOrder = 1;

    for (let section of sections) {
      section = section.trim();
      if (!section) continue;

      const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) continue;

      let firstLine = lines[0];
      let levelLabel = firstLine
        .replace(/^[#_\s]+/, '') 
        .replace(/[#_\s]+$/, '')
        .replace(/__|\*|\[|\]/g, '')
        .replace(/<a.*?>.*?<\/a>/g, '')
        .trim();
      
      const isLevel = levelLabel.toLowerCase().match(/niveau|initial|basique|opérationnel|opérationel|opérationelle|avancé|expert/);
      const isTitle = levelLabel.toLowerCase().includes('test de');
      
      if (!isLevel || isTitle) continue;

      console.log(`\n➡️  LEVEL: ${levelLabel}`);
      const threshold = (levelLabel.toLowerCase().includes('initial') || levelLabel.toLowerCase() === 'initial') ? 100 : config.successThreshold;

      const levelInsert = await client.query(
        'INSERT INTO levels (label, "order", "successThreshold", "formationId") VALUES ($1, $2, $3, $4) RETURNING id',
        [levelLabel, levelOrder++, threshold, formationId]
      );
      const levelId = levelInsert.rows[0].id;

      // specialized extraction
      const questionsData = [];
      let currentQuestion = null;

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let isQuestion = false;
          let isOption = false;
          let text = '';
          let isCorrect = line.includes('✅');

          if (config.slug === 'photoshop') {
              // Q: __Q1. ...__
              const qMatch = line.match(/^__\s*Q\d+.*?\.\s*(.*?)__/i);
              if (qMatch && !isCorrect) {
                  isQuestion = true;
                  text = qMatch[1].trim();
              } else {
                  // O: A. ...
                  const oMatch = line.match(/^[A-D]\s*\.\s*(.*)/i);
                  if (oMatch) {
                      isOption = true;
                      text = oMatch[1].replace(/✅|__/g, '').trim();
                  }
              }
          } else if (config.slug === 'outlook') {
              // Q: __1- ...__ OR # <a...>...
              const qMatch1 = line.match(/^__\s*\d+[-.]\s*(.*?)__/);
              const qMatch2 = line.match(/^#\s*<a.*?>.*?<\/a>\s*(.*)/i);
              const qMatch3 = line.match(/^__\s*Q\d+.*?\.\s*(.*?)__/i);
              
              if ((qMatch1 || qMatch2 || qMatch3) && !isCorrect) {
                  isQuestion = true;
                  text = (qMatch1 ? qMatch1[1] : (qMatch2 ? qMatch2[1] : qMatch3[1])).trim();
              } else {
                  // O: - A. ...
                  const oMatch = line.match(/^[-]\s*[A-D]\s*\.?\s*(.*)/i);
                  if (oMatch) {
                      isOption = true;
                      text = oMatch[1].replace(/✅|__/g, '').trim();
                  }
              }
          } else if (config.slug === 'illustrator') {
              // Q: 1. __...__ OR __1) ...__
              const qMatch1 = line.match(/^\d+[\s\.\)]+__(.*?)__/);
              const qMatch2 = line.match(/^__\s*\d+[\s\.\)]+(.*?)__/);
              
              if ((qMatch1 || qMatch2) && !isCorrect) {
                  isQuestion = true;
                  text = (qMatch1 ? qMatch1[1] : qMatch2[1]).trim();
              } else {
                  // O: 1. ... (NOT bolded)
                  const oMatch = line.match(/^\d+[\s\.\)]+\s*(.*)/);
                  if (oMatch) {
                      isOption = true;
                      text = oMatch[1].replace(/✅|__/g, '').trim();
                  }
              }
          }

          // console.log(`[DEBUG] Line ${i}: isQ=${isQuestion}, isO=${isOption}, text="${text.substring(0, 20)}..."`);

          if (isQuestion) {
              if (currentQuestion) questionsData.push(currentQuestion);
              currentQuestion = { text, options: [], correct: -1 };
          } else if (isOption && currentQuestion) {
              currentQuestion.options.push(text);
              if (isCorrect) currentQuestion.correct = currentQuestion.options.length - 1;
          }
      }
      if (currentQuestion) questionsData.push(currentQuestion);

      let qCount = 0;
      for (const q of questionsData) {
          if (q.options.length === 0 || !q.text) continue;
          if (q.correct === -1) console.warn(`      ⚠️  NO CORRECT: "${q.text.substring(0, 30)}..."`);
          await client.query(
            'INSERT INTO questions (text, options, "correctResponseIndex", "order", type, "responseType", "levelId", "formationId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [q.text, JSON.stringify(q.options), q.correct, qCount + 1, 'positionnement', 'qcm', levelId, formationId]
          );
          console.log(`      ✅ Q${qCount + 1} [${q.options.length} opts]: ${q.text.substring(0, 50)}...`);
          qCount++;
      }
    }
  } catch (err) {
    console.error(`❌ Error seeding ${targetKey}:`, err);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const args = process.argv.slice(2);
    const target = args[0];

    if (target) {
      await seedFormation(target);
    } else {
      for (const key in FORMATIONS_CONFIG) {
        await seedFormation(key);
      }
    }
  } catch (e) {
    console.error('❌ Global error:', e);
  } finally {
    await client.end();
    console.log('\n✨ All seeding tasks completed!');
  }
}

main();
