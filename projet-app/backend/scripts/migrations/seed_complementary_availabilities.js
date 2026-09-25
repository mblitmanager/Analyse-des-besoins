/**
 * seed_complementary_availabilities.js
 * Seeds questions for types: 'complementary' and 'availabilities'
 * Run: node seed_complementary_availabilities.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const complementaryQuestions = [
  {
    text: "Quel est votre métier actuel ?",
    options: JSON.stringify([]),
    correctResponseIndex: 0,
    order: 1,
    isActive: true,
    type: 'complementary',
    category: 'Profil professionnel',
    icon: 'work',
    metadata: JSON.stringify({ type: 'textarea', rows: 2, placeholder: 'Ex : Comptable, Vendeur, Secrétaire...' }),
  },
  {
    text: "Êtes-vous en recherche d'emploi ?",
    options: JSON.stringify(["Oui", "Non"]),
    correctResponseIndex: 0,
    order: 2,
    isActive: true,
    type: 'complementary',
    category: 'Profil professionnel',
    icon: 'search',
    metadata: JSON.stringify({ type: 'radio_toggle' }),
  },
  {
    text: "Avez-vous une reconnaissance de travailleur handicapé (RQTH) ?",
    options: JSON.stringify(["Oui", "Non"]),
    correctResponseIndex: 0,
    order: 3,
    isActive: true,
    type: 'complementary',
    category: 'Profil professionnel',
    icon: 'accessible',
    metadata: JSON.stringify({ type: 'radio_toggle' }),
  },
  {
    text: "Si oui, souhaitez-vous des aménagements spécifiques pour votre formation ?",
    options: JSON.stringify([]),
    correctResponseIndex: 0,
    order: 4,
    isActive: true,
    type: 'complementary',
    category: 'Profil professionnel',
    icon: 'settings_accessibility',
    metadata: JSON.stringify({
      type: 'textarea',
      rows: 3,
      placeholder: 'Décrivez vos besoins d\'aménagement...',
      condition: "handicap == 'Oui'",
    }),
  },
];

const availabilitiesQuestions = [
  {
    text: "Quels créneaux vous conviennent pour vous former ?",
    options: JSON.stringify(["Matin", "Après-midi", "Journée complète"]),
    correctResponseIndex: 0,
    order: 1,
    isActive: true,
    type: 'availabilities',
    category: 'Disponibilités',
    icon: 'schedule',
    metadata: JSON.stringify({
      type: 'multi_select',
      icons: ['wb_sunny', 'light_mode', 'calendar_today'],
    }),
  },
  {
    text: "Quelles sont vos dates de début souhaitées ?",
    options: JSON.stringify([]),
    correctResponseIndex: 0,
    order: 2,
    isActive: true,
    type: 'availabilities',
    category: 'Disponibilités',
    icon: 'event',
    metadata: JSON.stringify({
      type: 'textarea',
      rows: 2,
      placeholder: 'Ex : À partir du 1er mars 2025, semaines paires uniquement...',
    }),
  },
  {
    text: "Commentaires ou contraintes supplémentaires sur vos disponibilités",
    options: JSON.stringify([]),
    correctResponseIndex: 0,
    order: 3,
    isActive: true,
    type: 'availabilities',
    category: 'Disponibilités',
    icon: 'comment',
    metadata: JSON.stringify({
      type: 'textarea',
      rows: 3,
      placeholder: 'Ex : Indisponible le mardi matin, contraintes personnelles...',
    }),
  },
];

async function seed() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  // Clean existing complementary and availabilities questions
  await client.query(`DELETE FROM questions WHERE type IN ('complementary', 'availabilities')`);
  console.log('🗑️  Cleared old complementary and availabilities questions');

  const allQuestions = [...complementaryQuestions, ...availabilitiesQuestions];

  for (const q of allQuestions) {
    await client.query(
      `INSERT INTO questions (text, options, "correctResponseIndex", "order", "isActive", type, category, icon, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [q.text, q.options, q.correctResponseIndex, q.order, q.isActive, q.type, q.category, q.icon, q.metadata]
    );
    console.log(`  ➕ Inserted [${q.type}] : ${q.text.substring(0, 60)}...`);
  }

  console.log(`\n✅ Done — ${allQuestions.length} questions inserted.`);
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  client.end();
  process.exit(1);
});
