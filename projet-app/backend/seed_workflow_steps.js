const { Client } = require('pg');

const config = {
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
};

const data = [
  {"code":"IDENTIFICATION","label":"Identification du bénéficiaire","order":1,"route":"/","isActive":true},
  {"code":"FORMATION_SELECTION","label":"Choix de la formation","order":2,"route":"/formations","isActive":true},
  {"code":"PREREQUIS","label":"Test informatique prérequis","order":3,"route":"/prerequis","isActive":true},
  {"code":"POSITIONNEMENT","label":"Test de positionnement","order":4,"route":"/positionnement","isActive":true},
  {"code":"RESULTATS","label":"Résultat et validation de la formation","order":5,"route":"/resultats","isActive":true},
  {"code":"COMPLEMENTARY","label":"Questions complémentaires","order":6,"route":"/complementary","isActive":true},
  {"code":"AVAILABILITIES","label":"Disponibilités","order":7,"route":"/availabilities","isActive":true},
  {"code":"VALIDATION","label":"Validation finale","order":8,"route":"/validation","isActive":true}
];

async function seedSteps() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connecté à la base de données locale.');

    console.log('Nettoyage de la table workflow_steps...');
    await client.query('TRUNCATE TABLE workflow_steps RESTART IDENTITY CASCADE');

    console.log('Insertion des nouvelles étapes...');
    for (const step of data) {
      await client.query(
        'INSERT INTO workflow_steps (code, label, "order", route, "isActive") VALUES ($1, $2, $3, $4, $5)',
        [step.code, step.label, step.order, step.route, step.isActive]
      );
      console.log(`  Étape ${step.code} ajoutée.`);
    }

    console.log('Mise à jour terminée avec succès !');
  } catch (err) {
    console.error('Erreur lors du seeding:', err);
  } finally {
    await client.end();
  }
}

seedSteps();
