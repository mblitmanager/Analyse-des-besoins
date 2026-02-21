/**
 * seed_toeic_and_admin.js
 * Seeds TOEIC positionnement questions (A1-C1) and IT prerequisites from the provided Markdown file.
 * Also creates an admin profile.
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const itPrerequisites = [
  {
    text: "Niveau numérique",
    options: ["Débutant", "Intermédiaire", "Avancé"],
    type: 'prerequis',
    order: 1,
  },
  {
    text: "Fréquence d’utilisation d’un ordinateur",
    options: ["Tous les jours", "Occasionnelle", "Jamais"],
    type: 'prerequis',
    order: 2,
  },
  {
    text: "Savoir allumer un ordinateur, utiliser le clavier et la souris",
    options: ["Acquis", "Moyen", "Insuffisant"],
    type: 'prerequis',
    order: 3,
  },
  {
    text: "Se repérer dans l’environnement Windows (bureau, menu démarrer, les fenêtres, les icônes, les applications…):",
    options: ["Acquis", "Moyen", "Insuffisant"],
    type: 'prerequis',
    order: 4,
  },
  {
    text: "Savoir naviguer sur internet",
    options: ["Acquis", "Moyen", "Insuffisant"],
    type: 'prerequis',
    order: 5,
  },
  {
    text: "Utilisez-vous les logiciels suivants :",
    options: ["Traitement de texte type Word, Google Docs", "Tableur feuille de calcul type Excel, Google Sheets", "Logiciel de présentation type PowerPoint, Google Slides", "Je n’utilise aucun de ces logiciels"],
    type: 'prerequis',
    order: 6,
  },
  {
    text: "Avez-vous déjà réalisé des démarches administratives en ligne ?",
    options: ["Oui", "Non"],
    type: 'prerequis',
    order: 7,
  },
  {
    text: "Sur votre ordinateur, savez vous effectuer les manipulations suivantes ?",
    options: ["Protéger votre ordinateur avec un antivirus", "Mettre à jour votre système d’exploitation et vos logiciels", "Changer vos mots de passe régulièrement", "Aucun des trois"],
    type: 'prerequis',
    order: 8,
  },
];

const toeicData = [
  // A1
  { level: 'A1', text: "Hello, my name ___ Sarah.", options: ["am", "is", "are", "Je ne sais pas"], correct: 1, order: 1 },
  { level: 'A1', text: "We ___ English on Monday.", options: ["are", "have", "has", "Je ne sais pas"], correct: 1, order: 2 },
  { level: 'A1', text: "She ___ 12 years old.", options: ["is", "are", "has", "Je ne sais pas"], correct: 0, order: 3 },
  { level: 'A1', text: "There ___ a book on the table.", options: ["are", "have", "is", "Je ne sais pas"], correct: 2, order: 4 },
  { level: 'A1', text: "She ___ TV right now.", options: ["watches", "watching", "is watching", "Je ne sais pas"], correct: 2, order: 5 },
  { level: 'A1', text: "She ___ to the gym three times a week.", options: ["go", "goes", "is going", "Je ne sais pas"], correct: 1, order: 6 },
  // A2
  { level: 'A2', text: "We ___ tired, so we decided to go home.", options: ["was", "were", "are", "Je ne sais pas"], correct: 1, order: 7 },
  { level: 'A2', text: "While I ___ TV, I heard a strange noise.", options: ["am watching", "were watching", "was watching", "Je ne sais pas"], correct: 2, order: 8 },
  { level: 'A2', text: "There isn’t ___ milk left in the fridge.", options: ["many", "much", "a few", "Je ne sais pas"], correct: 1, order: 9 },
  { level: 'A2', text: "He’s the ___ student in the class.", options: ["more tall", "taller", "tallest", "Je ne sais pas"], correct: 2, order: 10 },
  { level: 'A2', text: "Mary is ___ her sister.", options: ["as beautiful as", "beautiful", "more beautiful", "Je ne sais pas"], correct: 0, order: 11 },
  { level: 'A2', text: "We ___ to the supermarket yesterday.", options: ["go", "went", "are going", "Je ne sais pas"], correct: 1, order: 12 },
  // B1
  { level: 'B1', text: "I’ve known her ___ we were children.", options: ["for", "since", "during", "Je ne sais pas"], correct: 1, order: 13 },
  { level: 'B1', text: "If I ___ more time, I would travel around the world.", options: ["have", "had", "will have", "Je ne sais pas"], correct: 1, order: 14 },
  { level: 'B1', text: "The castle ___ in 1692.", options: ["was built", "is built", "was building", "Je ne sais pas"], correct: 0, order: 15 },
  { level: 'B1', text: "She ___ here for five years.", options: ["has worked", "works", "is working", "Je ne sais pas"], correct: 0, order: 16 },
  { level: 'B1', text: "He felt sick because he ___ too much chocolate.", options: ["ate", "has eaten", "had eaten", "Je ne sais pas"], correct: 2, order: 17 },
  { level: 'B1', text: "I ___ more water recently and I feel better.", options: ["have been drinking", "had drunk", "drank", "Je ne sais pas"], correct: 0, order: 18 },
  // B2
  { level: 'B2', text: "You ___ me about the problem earlier.", options: ["should have told", "should told", "must", "Je ne sais pas"], correct: 0, order: 19 },
  { level: 'B2', text: "If the baby had slept better, I ___ so tired.", options: ["won’t be", "wouldn’t be", "wouldn’t have been", "Je ne sais pas"], correct: 2, order: 20 },
  { level: 'B2', text: "By this time next year, I ___ my studies.", options: ["will finish", "will have finished", "am finishing", "Je ne sais pas"], correct: 1, order: 21 },
  { level: 'B2', text: "This time tomorrow, we ___ on the beach.", options: ["will lie", "will be lying", "lie", "Je ne sais pas"], correct: 1, order: 22 },
  { level: 'B2', text: "The meeting was called ___ due to unexpected problems.", options: ["off", "up", "out", "Je ne sais pas"], correct: 0, order: 23 },
  { level: 'B2', text: "___ he was tired, he continued working.", options: ["Because", "Despite", "Although", "Je ne sais pas"], correct: 2, order: 24 },
  // C1
  { level: 'C1', text: "You ___ apologise now if you want to avoid further conflict.", options: ["would rather", "had better", "will", "Je ne sais pas"], correct: 1, order: 25 },
  { level: 'C1', text: "I’d rather you ___ this matter confidential.", options: ["kept", "keep", "will keep", "Je ne sais pas"], correct: 0, order: 26 },
  { level: 'C1', text: "The committee demanded that the report ___ before Friday.", options: ["is submitted", "was submitted", "be submitted", "Je ne sais pas"], correct: 2, order: 27 },
  { level: 'C1', text: "___ the circumstances, his reaction was surprisingly restrained.", options: ["Because", "Although", "Given", "Je ne sais pas"], correct: 2, order: 28 },
  { level: 'C1', text: "Rarely ___ such a compelling argument.", options: ["I have heard", "have I heard", "I heard", "Je ne sais pas"], correct: 1, order: 29 },
  { level: 'C1', text: "Not only ___ late, but he also failed to apologise.", options: ["he arrived", "did he arrive", "he did arrive", "Je ne sais pas"], correct: 1, order: 30 },
];

async function seed() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  // 1. Create Admin
  const adminEmail = 'admin@wizi-learn.com';
  const adminPass = 'Wizi2025*'; // Standard password
  const hashedPass = await bcrypt.hash(adminPass, 10);
  
  const userExists = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
  if (userExists.rows.length === 0) {
    await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [adminEmail, hashedPass, 'admin']);
    console.log(`👤 Admin created: ${adminEmail} / ${adminPass}`);
  } else {
    console.log(`👤 Admin already exists: ${adminEmail}`);
  }

  // 2. Seed IT Prerequisites (Generic)
  await client.query("DELETE FROM questions WHERE type = 'prerequis'");
  for (const q of itPrerequisites) {
    await client.query(
      'INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type) VALUES ($1, $2, $3, $4, $5, $6)',
      [q.text, JSON.stringify(q.options), -1, q.order, true, 'prerequis']
    );
  }
  console.log('💻 IT Prerequisites seeded.');

  // 3. Seed TOEIC Formations and Levels
  const englishSlugs = ['toeic', 'anglais'];
  
  for (const slug of englishSlugs) {
    let formation = (await client.query("SELECT id, label FROM formations WHERE slug = $1", [slug])).rows[0];
    if (!formation) {
      formation = (await client.query("INSERT INTO formations (slug, label, category, icon, color, \"isActive\") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, label", 
        [slug, slug === 'toeic' ? 'Anglais (TOEIC)' : 'Anglais', 'LANGUES', 'translate', 'blue-600', true])).rows[0];
      console.log(`📚 Formation ${slug} created.`);
    }

    // Clean up generic levels if they exist for this English formation
    await client.query('DELETE FROM levels WHERE "formationId" = $1 AND label IN (\'Débutant\', \'Intermédiaire\', \'Avancé\', \'Expert\')', [formation.id]);
    console.log(`🧹 Generic levels for ${slug} cleaned up.`);

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const levelMap = {};
    for (let i = 0; i < levels.length; i++) {
      const lLabel = levels[i];
      let level = (await client.query('SELECT id FROM levels WHERE label = $1 AND "formationId" = $2', [lLabel, formation.id])).rows[0];
      if (!level) {
        level = (await client.query('INSERT INTO levels (label, "order", "successThreshold", "formationId") VALUES ($1, $2, $3, $4) RETURNING id',
          [lLabel, i + 1, 5, formation.id])).rows[0];
        console.log(`📊 Level ${lLabel} for ${slug} created (Threshold: 5).`);
      } else {
        await client.query('UPDATE levels SET "successThreshold" = 5 WHERE id = $1', [level.id]);
        console.log(`📊 Level ${lLabel} for ${slug} updated (Threshold: 5).`);
      }
      levelMap[lLabel] = level.id;
    }

    // 4. Seed Questions for this formation
    await client.query('DELETE FROM questions WHERE type = \'positionnement\' AND "formationId" = $1', [formation.id]);
    for (const q of toeicData) {
      await client.query(
        'INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, "levelId", "formationId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [q.text, JSON.stringify(q.options), q.correct, q.order, true, 'positionnement', levelMap[q.level], formation.id]
      );
    }
    console.log(`📝 TOEIC Questions for ${slug} seeded.`);
  }

  console.log('\n✅ Seeding complete!');
  await client.end();
}

seed().catch(err => {
  console.error('❌ Error during seeding:', err);
  client.end();
});
