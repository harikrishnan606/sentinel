const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../sentinel.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage REAL,
      ram_usage REAL,
      ram_total REAL,
      ram_free REAL
    )`);
  });
}

function saveMetrics(cpu, ram) {
  const stmt = db.prepare(`INSERT INTO metrics (cpu_usage, ram_usage, ram_total, ram_free) VALUES (?, ?, ?, ?)`);
  stmt.run(cpu, ram.active, ram.total, ram.free);
  stmt.finalize();
}

function getHistory(limit = 60, callback) {
  db.all(`SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows) => {
    if (err) {
      console.error(err.message);
      callback([]);
    } else {
      callback(rows.reverse());
    }
  });
}

module.exports = { db, saveMetrics, getHistory };
