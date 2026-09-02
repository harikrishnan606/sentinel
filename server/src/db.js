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
        // Enable Write-Ahead Logging for high-throughput, non-blocking inserts
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;');

        db.run(`CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            cpu_usage REAL,
            ram_usage REAL,
            ram_total REAL,
            ram_free REAL
        )`);

        db.run('CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics (timestamp)');

        // Prune entries older than 7 days to maintain high performance
        db.run("DELETE FROM metrics WHERE timestamp < datetime('now', '-7 days')", (err) => {
            if (err) console.warn('Could not prune old metrics:', err.message);
        });
    });
}

function saveMetrics(cpu, ram) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO metrics (timestamp, cpu_usage, ram_usage, ram_total, ram_free) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(now, cpu, ram.active, ram.total, ram.free, (err) => {
        if (err) console.error('Error saving metrics:', err.message);
    });
    stmt.finalize();
}

function getHistory(limit = 60, callback) {
    // ORDER BY id DESC leverages the clustered primary key index for sub-millisecond retrieval
    db.all(`SELECT * FROM metrics ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
        if (err) {
            console.error('Error querying history:', err.message);
            callback([]);
        } else {
            callback(rows.reverse());
        }
    });
}

module.exports = { db, saveMetrics, getHistory };
