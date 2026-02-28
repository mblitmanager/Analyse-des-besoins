const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const FORMATIONS_CONFIG = {
  photoshop: {
    slugs: ['photoshop'],
    fileName: 'Photoshop-Test AB.md',
    successThreshold: 0.8, // 80%
    prerequisites: [
      { text: "Avez-vous déjà retravaillé, recadré ou modifié des photos numériques ?", options: ["Oui, de manière régulière", "Oui, occasionnellement", "Jamais"], correct: -1 },
      { text: "Comprenez-vous la différence entre une image et un texte modifiable ?", options: ["Oui, tout à fait", "A peu près", "Non"], correct: -1 }
    ]
  },
  outlook: {
    slugs: ['outlook', 'pack-office-outlook'],
    fileName: 'Outlook-Test AB.md',
    successThreshold: 0.8,
    prerequisites: [
      { text: "Avez-vous déjà utilisé une messagerie professionnelle ?", options: ["Oui, quotidiennement", "Oui, occasionnellement", "Jamais"], correct: -1 },
      { text: "Savez-vous ce qu'est une pièce jointe ?", options: ["Oui", "Non", "Je ne suis pas sûr"], correct: -1 }
    ]
  },
  illustrator: {
    slugs: ['illustrator'],
    fileName: 'Illustrator-Test AB.md',
    successThreshold: 0.8,
    prerequisites: [
      { text: "Avez-vous déjà utilisé un logiciel de dessin ?", options: ["Oui", "Non", "De temps en temps"], correct: -1 },
      { text: "Connaissez-vous la différence entre pixel et vecteur ?", options: ["Oui", "Non", "Vaguement"], correct: -1 }
    ]
  }
};

async function seedFormation(targetKey) {
  const config = FORMATIONS_CONFIG[targetKey];
  if (!config) return;

  try {
    const mdPath = path.join(__dirname, '..', 'parsed_tests', config.fileName);
    if (!fs.existsSync(mdPath)) return;
    const content = fs.readFileSync(mdPath, 'utf-8');

    // 1. Find all formation IDs for the slugs
    const formRes = await client.query('SELECT id, slug, label FROM formations WHERE slug = ANY($1)', [config.slugs]);
    if (formRes.rows.length === 0) {
      console.error(`❌ Formations not found for slugs: ${config.slugs.join(', ')}`);
      return;
    }

    for (const formation of formRes.rows) {
      const formationId = formation.id;
      console.log(`\n📚 [${targetKey.toUpperCase()}] Seeding: ${formation.label} (Slug: ${formation.slug}, ID: ${formationId})`);

      // 2. Clear old data
      await client.query('DELETE FROM questions WHERE type = \'positionnement\' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)', [formationId]);
      await client.query('DELETE FROM levels WHERE "formationId" = $1', [formationId]);
      await client.query('DELETE FROM questions WHERE type = \'prerequis\' AND "formationId" = $1', [formationId]);
      // Also clear any 'mise_a_niveau' for this formation to avoid corrupted data
      await client.query('DELETE FROM questions WHERE type = \'mise_a_niveau\' AND "formationId" = $1', [formationId]);

      // 3. Insert Prerequisites
      for (let i = 0; i < config.prerequisites.length; i++) {
        const p = config.prerequisites[i];
        await client.query(
          'INSERT INTO questions (text, options, "correctResponseIndex", "order", type, "formationId", "isActive", "responseType") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [p.text, JSON.stringify(p.options), p.correct, i + 1, 'prerequis', formationId, true, 'qcm']
        );
      }
      console.log(`   ✅ Inserted ${config.prerequisites.length} prerequisites`);

      // 4. Parse Levels and Questions
      const sections = content.split(/\n(?=#{1,3}\s+|__Niveau|__Initial|__Basique|__Opérationnel|__Avancé|__Expert)/i);
      let levelOrder = 1;

      for (let section of sections) {
        section = section.trim();
        if (!section) continue;

        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let levelLabel = lines[0]
          .replace(/^[#_\s]+/, '').replace(/[#_\s]+$/, '')
          .replace(/__|\*|\[|\]/g, '').replace(/<a.*?>.*?<\/a>/g, '').trim();
        
        const isLevel = levelLabel.toLowerCase().match(/niveau|initial|basique|opérationnel|opérationel|opérationelle|avancé|expert/);
        const isTitle = levelLabel.toLowerCase().includes('test de');
        if (!isLevel || isTitle) continue;

        // Extract Questions first to calculate total count for successThreshold
        const questionsData = [];
        let currentQuestion = null;

        for (const line of lines) {
          let isQuestion = false, isOption = false, text = '', isCorrect = line.includes('✅');

          if (targetKey === 'photoshop' || targetKey === 'outlook') {
            const qMatch = line.match(/^__\s*(?:Q\d+|\d+[\s\.\-\)]+)\s*(.*?)__/i) || line.match(/^#\s*<a.*?>.*?<\/a>\s*(.*)/i);
            if (qMatch && !isCorrect) {
              isQuestion = true; text = qMatch[1].replace(/__/g, '').trim();
            } else {
              const oMatch = line.match(/^(?:[-]\s*)?[A-D]\s*\.?\s*(.*)/i);
              if (oMatch) { isOption = true; text = oMatch[1].replace(/✅|__/g, '').trim(); }
            }
          } else if (targetKey === 'illustrator') {
            const qMatch = line.match(/^\d+[\s\.\)]+__(.*?)__/) || line.match(/^__\s*\d+[\s\.\)]+(.*?)__/);
            if (qMatch && !isCorrect) {
              isQuestion = true; text = qMatch[1].trim();
            } else {
              const oMatch = line.match(/^\d+[\s\.\)]+\s*(.*)/);
              if (oMatch) { isOption = true; text = oMatch[1].replace(/✅|__/g, '').trim(); }
            }
          }

          if (isQuestion) {
            if (currentQuestion) questionsData.push(currentQuestion);
            currentQuestion = { text, options: [], correct: -1 };
          } else if (isOption && currentQuestion) {
            currentQuestion.options.push(text);
            if (isCorrect) currentQuestion.correct = currentQuestion.options.length - 1;
          }
        }
        if (currentQuestion) questionsData.push(currentQuestion);

        const validQuestions = questionsData.filter(q => q.options.length > 0 && q.text);
        if (validQuestions.length === 0) continue;

        // Success Threshold: usually 80% of total questions
        const threshold = (levelLabel.toLowerCase().includes('initial') || levelLabel.toLowerCase() === 'initial') 
                         ? validQuestions.length 
                         : Math.ceil(validQuestions.length * config.successThreshold);

        const levelInsert = await client.query(
          'INSERT INTO levels (label, "order", "successThreshold", "formationId") VALUES ($1, $2, $3, $4) RETURNING id',
          [levelLabel, levelOrder++, threshold, formationId]
        );
        const levelId = levelInsert.rows[0].id;

        for (let i = 0; i < validQuestions.length; i++) {
          const q = validQuestions[i];
          await client.query(
            'INSERT INTO questions (text, options, \"correctResponseIndex\", \"order\", type, \"responseType\", \"levelId\", \"formationId\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [q.text, JSON.stringify(q.options), q.correct, i + 1, 'positionnement', 'qcm', levelId, formationId]
          );
        }
        console.log(`   ➡️  Level ${levelLabel}: ${validQuestions.length} questions (Threshold: ${threshold})`);
      }
    }
  } catch (err) {
    console.error(`❌ Error seeding ${targetKey}:`, err);
  }
}

async function main() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');
  for (const key in FORMATIONS_CONFIG) await seedFormation(key);
  await client.end();
  console.log('\n✨ All seeding tasks completed successfully!');
}

main();
