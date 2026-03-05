const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/db.sqlite');

db.serialize(() => {
  db.all("SELECT * FROM parcours_rules WHERE formation = 'Word' OR formation = 'DigComp'", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
  });
});
db.close();
