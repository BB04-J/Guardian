const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/guardian.db';

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'employee',
    department  TEXT,
    risk_score  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id               TEXT PRIMARY KEY,
    timestamp        DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id          TEXT REFERENCES users(id),
    department       TEXT,
    ai_platform      TEXT NOT NULL,
    risk_level       TEXT NOT NULL,
    action           TEXT NOT NULL,
    threat_types     TEXT NOT NULL DEFAULT '[]',
    prompt_preview   TEXT,
    response_preview TEXT,
    sanitized        INTEGER NOT NULL DEFAULT 0,
    device_id        TEXT
  );

  CREATE TABLE IF NOT EXISTS policies (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'builtin',
    pattern     TEXT,
    threshold   TEXT NOT NULL DEFAULT 'warn',
    enabled     INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_timestamp  ON incidents(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_incidents_risk_level ON incidents(risk_level);
  CREATE INDEX IF NOT EXISTS idx_incidents_user_id    ON incidents(user_id);
`);

module.exports = db;
