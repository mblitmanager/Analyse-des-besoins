
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\MBL IT MANAGER\\Desktop\\Herizo\\AOPIA-LIKE\\Analyse des besoins\\CDC_Fonctionnel_images\\scrap\\wizi_contacts.csv', 'utf8');
const lines = content.split(/\r?\n/).slice(0, 10);
console.log(JSON.stringify(lines, null, 2));
