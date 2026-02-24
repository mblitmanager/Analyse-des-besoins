import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { DataSource } from 'typeorm';
import { Contact } from '../entities/contact.entity';

async function main() {
  const csvPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(
        __dirname,
        '../../../../CDC_Fonctionnel_images/scrap/wizi_contacts.csv',
      );

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length <= 1) {
    console.error('CSV looks empty or only headers.');
    process.exit(1);
  }

  // simple CSV parser (semicolon separated)
  const rows = lines.slice(1).map((line) => {
    // normalize NBSP and trim
    const cleaned = line.replace(/\u00A0/g, ' ');
    const cols = cleaned.split(';').map((c) => c.trim());
    return cols;
  });

  // build DataSource
  const databaseUrl = process.env.DATABASE_URL;
  const AppDataSource = new DataSource(
    databaseUrl
      ? {
          type: 'postgres',
          url: databaseUrl,
          ssl: databaseUrl.includes('localhost')
            ? false
            : { rejectUnauthorized: false },
          entities: [Contact],
        }
      : {
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: +(process.env.DATABASE_PORT || 5432),
          username: process.env.DATABASE_USER || 'user',
          password: process.env.DATABASE_PASSWORD || 'password',
          database: process.env.DATABASE_NAME || 'Wizilearn',
          entities: [Contact],
        },
  );

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Contact);

  console.log('Clearing existing contacts...');
  await repo.clear();

  let inserted = 0;
  for (const cols of rows) {
    // Actual: Catégorie;Civilité;ID;Nom;Prénom;Email;Téléphone
    const [categorie, civilite, id, nom, prenom, emailRaw, telephoneRaw] = cols;
    const email =
      emailRaw && emailRaw.toUpperCase() !== 'N/A' ? emailRaw : null;
    const telephone = telephoneRaw
      ? telephoneRaw.replace(/\s+/g, ' ').trim()
      : '';

    const contact = new Contact();
    contact.civilite = civilite || '';
    contact.nom = nom || '';
    contact.prenom = prenom || '';
    contact.email = email;
    contact.telephone = telephone || '';
    // store CSV category in conseiller to preserve grouping
    contact.conseiller = categorie || '';

    try {
      await repo.save(contact);
      inserted += 1;
    } catch (err) {
      console.error(
        'Failed to insert contact',
        nom,
        prenom,
        err.message || err,
      );
    }
  }

  console.log(`Inserted ${inserted} contacts from ${csvPath}`);
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
