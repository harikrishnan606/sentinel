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

let pruneTimer = null;

function pruneOldMetrics(hours = 24, maxRows = 86400) {
    const cutoffIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    // Prune both by timestamp cutoff and cap at maxRows to guarantee bounded size
    db.run(
        `DELETE FROM metrics 
         WHERE timestamp < ? 
            OR id < (SELECT MAX(id) - ? FROM metrics)`,
        [cutoffIso, maxRows],
        function(err) {
            if (err) {
                console.warn('Could not prune old metrics:', err.message);
            } else if (this.changes > 0) {
                console.log(`Pruned ${this.changes} old metric records.`);
                // Periodic WAL checkpoint to keep log file compact
                db.run('PRAGMA wal_checkpoint(PASSIVE);');
            }
        }
    );
}

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

        // Initial pruning on startup (keep last 24h / 86,400 entries)
        pruneOldMetrics(24);

        // Schedule automatic pruning every hour
        if (!pruneTimer) {
            pruneTimer = setInterval(() => pruneOldMetrics(24), 60 * 60 * 1000);
            if (pruneTimer.unref) pruneTimer.unref();
        }
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

module.exports = { db, saveMetrics, getHistory, pruneOldMetrics };
