const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(formations)", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    const columns = rows.map(r => r.name);
    console.log("Columns in 'formations' table:");
    console.log(columns.join(", "));
    if (columns.includes("enableLowScoreWarning")) {
      console.log("SUCCESS: 'enableLowScoreWarning' exists.");
    } else {
      console.log("FAILURE: 'enableLowScoreWarning' DOES NOT exist.");
    }
  }
  db.close();
});
