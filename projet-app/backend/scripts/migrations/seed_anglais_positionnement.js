/**
 * seed_anglais_positionnement.js
 * Crée les niveaux A1→C2 pour la formation Anglais
 * et insère des questions d'exemple de positionnement pour chaque niveau.
 * Run: node seed_anglais_positionnement.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Questions par niveau CECRL pour l'Anglais
const levelData = [
  {
    label: 'A1', order: 1, successThreshold: 80,
    recommendationLabel: 'Niveau Débutant — Formation Anglais A1 recommandée',
    questions: [
      {
        text: "Choose the correct sentence:",
        options: ["I am a student.", "I is a student.", "I are a student.", "Me is student."],
        correctResponseIndex: 0,
        order: 1,
      },
      {
        text: "What is the plural of 'child'?",
        options: ["childs", "childes", "children", "childrens"],
        correctResponseIndex: 2,
        order: 2,
      },
      {
        text: "Complete: 'She ___ a teacher.'",
        options: ["am", "is", "are", "be"],
        correctResponseIndex: 1,
        order: 3,
      },
      {
        text: "Which word means the opposite of 'big'?",
        options: ["tall", "small", "fast", "heavy"],
        correctResponseIndex: 1,
        order: 4,
      },
      {
        text: "What day comes after Monday?",
        options: ["Sunday", "Saturday", "Wednesday", "Tuesday"],
        correctResponseIndex: 3,
        order: 5,
      },
    ],
  },
  {
    label: 'A2', order: 2, successThreshold: 80,
    recommendationLabel: 'Niveau Élémentaire — Formation Anglais A2 recommandée',
    questions: [
      {
        text: "Which sentence is in the past tense?",
        options: ["She goes to school.", "She will go to school.", "She went to school.", "She is going to school."],
        correctResponseIndex: 2,
        order: 1,
      },
      {
        text: "Choose the correct preposition: 'I was born ___ April.'",
        options: ["at", "on", "in", "by"],
        correctResponseIndex: 2,
        order: 2,
      },
      {
        text: "What is the comparative form of 'good'?",
        options: ["gooder", "more good", "better", "best"],
        correctResponseIndex: 2,
        order: 3,
      },
      {
        text: "Complete: 'There ___ many cars in the street.'",
        options: ["is", "are", "was", "be"],
        correctResponseIndex: 1,
        order: 4,
      },
      {
        text: "'I have lived here for ten years.' — Which tense is this?",
        options: ["Simple past", "Present perfect", "Past continuous", "Future simple"],
        correctResponseIndex: 1,
        order: 5,
      },
    ],
  },
  {
    label: 'B1', order: 3, successThreshold: 80,
    recommendationLabel: 'Niveau Intermédiaire — Formation Anglais B1 recommandée',
    questions: [
      {
        text: "Choose the correct form: 'If I ___ rich, I would travel the world.'",
        options: ["am", "was", "were", "will be"],
        correctResponseIndex: 2,
        order: 1,
      },
      {
        text: "What does 'nevertheless' mean?",
        options: ["therefore", "however", "moreover", "because"],
        correctResponseIndex: 1,
        order: 2,
      },
      {
        text: "Identify the passive voice:",
        options: [
          "The manager signed the contract.",
          "The contract was signed by the manager.",
          "The manager will sign the contract.",
          "The manager had signed the contract.",
        ],
        correctResponseIndex: 1,
        order: 3,
      },
      {
        text: "Complete correctly: 'She suggested ___ to the cinema.'",
        options: ["to go", "going", "go", "gone"],
        correctResponseIndex: 1,
        order: 4,
      },
      {
        text: "Choose the correct reported speech: He said: 'I am hungry.' →",
        options: [
          "He said he is hungry.",
          "He said he was hungry.",
          "He said he were hungry.",
          "He said he will be hungry.",
        ],
        correctResponseIndex: 1,
        order: 5,
      },
    ],
  },
  {
    label: 'B2', order: 4, successThreshold: 80,
    recommendationLabel: 'Niveau Intermédiaire Avancé — Formation Anglais B2 recommandée',
    questions: [
      {
        text: "Choose the most appropriate connector: 'The project failed ___ the team worked hard.'",
        options: ["although", "because", "therefore", "since"],
        correctResponseIndex: 0,
        order: 1,
      },
      {
        text: "Which sentence uses the subjunctive correctly?",
        options: [
          "It is important that he is on time.",
          "It is important that he be on time.",
          "It is important that he will be on time.",
          "It is important that he was on time.",
        ],
        correctResponseIndex: 1,
        order: 2,
      },
      {
        text: "What does 'to be on the fence' mean?",
        options: [
          "To be very excited",
          "To be undecided",
          "To be confused",
          "To be careful",
        ],
        correctResponseIndex: 1,
        order: 3,
      },
      {
        text: "Choose the correct form: 'By the time she arrived, we ___ for two hours.'",
        options: ["waited", "have waited", "had been waiting", "were waiting"],
        correctResponseIndex: 2,
        order: 4,
      },
      {
        text: "Which word is a synonym of 'alleviate'?",
        options: ["worsen", "relieve", "increase", "delay"],
        correctResponseIndex: 1,
        order: 5,
      },
    ],
  },
  {
    label: 'C1', order: 5, successThreshold: 80,
    recommendationLabel: 'Niveau Avancé — Formation Anglais C1 recommandée',
    questions: [
      {
        text: "Identify the correct use of the inversion:",
        options: [
          "Never I have seen such beauty.",
          "Never have I seen such beauty.",
          "I have never seen such beauty.",
          "Such beauty never I have seen.",
        ],
        correctResponseIndex: 1,
        order: 1,
      },
      {
        text: "What is the meaning of 'perfidious'?",
        options: ["loyal", "treacherous", "cautious", "generous"],
        correctResponseIndex: 1,
        order: 2,
      },
      {
        text: "Choose the correct cleft sentence:",
        options: [
          "It was John who broke the vase.",
          "It is John which broke the vase.",
          "It was John that has broken the vase.",
          "It were John who broke the vase.",
        ],
        correctResponseIndex: 0,
        order: 3,
      },
      {
        text: "'The legislation was tantamount to censorship.' — What does 'tantamount' mean?",
        options: ["similar to", "equivalent to", "opposed to", "resulting from"],
        correctResponseIndex: 1,
        order: 4,
      },
      {
        text: "Which sentence correctly uses a mixed conditional?",
        options: [
          "If I had studied harder, I would pass the exam now.",
          "If I studied harder, I would pass the exam.",
          "If I had studied harder, I would have passed the exam.",
          "If I study harder, I will pass the exam.",
        ],
        correctResponseIndex: 0,
        order: 5,
      },
    ],
  },
  {
    label: 'C2', order: 6, successThreshold: 80,
    recommendationLabel: 'Niveau Maîtrise — Préparation TOEIC avancée recommandée',
    questions: [
      {
        text: "Select the sentence that correctly uses an absolute phrase:",
        options: [
          "Her homework done, she went to play.",
          "With her homework done, she went to play.",
          "Having done her homework, she went to play.",
          "All of the above are correct.",
        ],
        correctResponseIndex: 3,
        order: 1,
      },
      {
        text: "What is the rhetorical device in: 'Ask not what your country can do for you'?",
        options: ["Anaphora", "Chiasmus", "Antithesis", "Epistrophe"],
        correctResponseIndex: 1,
        order: 2,
      },
      {
        text: "'The denouement of the novel surprised critics.' — 'Denouement' refers to:",
        options: [
          "The opening scene",
          "The climax",
          "The resolution",
          "The conflict",
        ],
        correctResponseIndex: 2,
        order: 3,
      },
      {
        text: "Choose the correct nuance: 'He was ___ in his refusal to compromise.' (strongest)",
        options: ["firm", "resolute", "steadfast", "intransigent"],
        correctResponseIndex: 3,
        order: 4,
      },
      {
        text: "Identify the grammatically correct sentence with a nominative absolute:",
        options: [
          "Weather permitting, we will proceed.",
          "If weather permits, we will proceed.",
          "Since the weather permits, we will proceed.",
          "The weather permitting us, we will proceed.",
        ],
        correctResponseIndex: 0,
        order: 5,
      },
    ],
  },
];

async function seed() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  // Get Anglais formation id
  const formRes = await client.query(
    `SELECT id FROM formations WHERE slug = 'anglais' LIMIT 1`
  );
  if (formRes.rows.length === 0) {
    console.error('❌ Formation "anglais" not found in DB!');
    await client.end();
    return;
  }
  const formationId = formRes.rows[0].id;
  console.log(`📚 Formation Anglais found (id=${formationId})`);

  // Delete existing levels (and cascade questions) for this formation
  await client.query(`DELETE FROM questions WHERE type = 'positionnement' AND "levelId" IN (SELECT id FROM levels WHERE "formationId" = $1)`, [formationId]);
  await client.query(`DELETE FROM levels WHERE "formationId" = $1`, [formationId]);
  console.log('🗑️  Cleared existing levels and positionnement questions for Anglais');

  for (const lvl of levelData) {
    // Insert level
    const lvlRes = await client.query(
      `INSERT INTO levels (label, "order", "successThreshold", "recommendationLabel", "formationId")
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [lvl.label, lvl.order, lvl.successThreshold, lvl.recommendationLabel, formationId]
    );
    const levelId = lvlRes.rows[0].id;
    console.log(`  📊 Level ${lvl.label} created (id=${levelId})`);

    // Insert questions for this level
    for (const q of lvl.questions) {
      await client.query(
        `INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, "levelId", "formationId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          q.text,
          JSON.stringify(q.options),
          q.correctResponseIndex,
          q.order,
          true,
          'positionnement',
          levelId,
          formationId,
        ]
      );
    }
    console.log(`     ➕ ${lvl.questions.length} questions inserted for level ${lvl.label}`);
  }

  console.log(`\n✅ Done — 6 levels (A1→C2) and ${levelData.reduce((s, l) => s + l.questions.length, 0)} questions seeded for Anglais.`);
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Error:', err.message);
  client.end();
  process.exit(1);
});
