const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE formations ADD COLUMN enableLowScoreWarning BOOLEAN NOT NULL DEFAULT 1", (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("Column 'enableLowScoreWarning' already exists in SQLite.");
      } else {
        console.error("Error adding column to SQLite:", err.message);
      }
    } else {
      console.log("Column 'enableLowScoreWarning' added to SQLite formations table.");
    }
  });
});

db.close();
