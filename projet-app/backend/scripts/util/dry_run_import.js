
const fs = require('fs');
const path = require('path');

const csvPath = 'c:\\Users\\MBL IT MANAGER\\Desktop\\Herizo\\AOPIA-LIKE\\Analyse des besoins\\CDC_Fonctionnel_images\\scrap\\wizi_contacts.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');

const rows = lines.slice(1).map((line) => {
  const cleaned = line.replace(/\u00A0/g, ' ');
  const cols = cleaned.split(';').map((c) => c.trim());
  return cols;
});

console.log('--- DRY RUN (First 5 Rows) ---');
for (let i = 0; i < Math.min(5, rows.length); i++) {
  const cols = rows[i];
  const [categorie, civilite, id, nom, prenom, emailRaw, telephoneRaw] = cols;
  console.log(`Row ${i + 1}:`);
  console.log(`  Cat: ${categorie}`);
  console.log(`  Civ: ${civilite}`);
  console.log(`  ID:  ${id}`);
  console.log(`  Nom: ${nom}`);
  console.log(`  Pre: ${prenom}`);
  console.log(`  Res: ${prenom} ${nom}`);
}
