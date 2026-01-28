// utils/storage.js
// SQLite storage for keys and runs, plus in memory verification and runs.

const path = require("path");
const Database = require("better-sqlite3");

// Where the sqlite file lives
const DB_PATH = path.join(__dirname, "..", "fxbot.sqlite");
const db = new Database(DB_PATH);

// Basic pragmas for safety and speed
db.pragma("journal_mode = WAL");

// Create tables if they do not exist
db.exec(`
CREATE TABLE IF NOT EXISTS keys_history (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL,
  quantity  INTEGER NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS runs_history (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL,
  dungeon   TEXT NOT NULL,
  quantity  INTEGER NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_keys_user ON keys_history(user_id);
CREATE INDEX IF NOT EXISTS idx_keys_timestamp ON keys_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs_history(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs_history(timestamp);
`);

function nowMs() {
  return Date.now();
}

function sevenDaysAgoMs() {
  return nowMs() - 7 * 24 * 60 * 60 * 1000;
}

// -----------------------------
// Verification sessions (in memory)
// -----------------------------

// userId -> { ign, code, createdAt }
const pendingVerifications = new Map();

// Verification sessions expire after 15 minutes
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000;

function createVerificationSession(userId, ign, code) {
  pendingVerifications.set(userId, {
    ign,
    code,
    createdAt: Date.now(),
  });
}

function getPendingVerification(userId) {
  const session = pendingVerifications.get(userId);
  if (!session) return null;

  // Check if session has expired
  if (Date.now() - session.createdAt > VERIFICATION_EXPIRY_MS) {
    pendingVerifications.delete(userId);
    return null;
  }

  return session;
}

function completeVerification(userId) {
  pendingVerifications.delete(userId);
}

// Cleanup expired verification sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of pendingVerifications) {
    if (now - session.createdAt > VERIFICATION_EXPIRY_MS) {
      pendingVerifications.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// -----------------------------
// Logging keys and runs to sqlite
// -----------------------------

function logKeys(userId, quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) return;

  const stmt = db.prepare(
    "INSERT INTO keys_history (user_id, quantity, timestamp) VALUES (?, ?, ?)"
  );
  stmt.run(userId, quantity, nowMs());
}

function logRuns(dungeon, userId, quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) return;

  const stmt = db.prepare(
    "INSERT INTO runs_history (user_id, dungeon, quantity, timestamp) VALUES (?, ?, ?, ?)"
  );
  stmt.run(userId, dungeon, quantity, nowMs());
}

// kind: "keys" or "runs"
// period: "allTime" or "weekly"
function getLeaderboard(kind, period = "allTime") {
  const cutoff = sevenDaysAgoMs();

  const table =
    kind === "keys" ? "keys_history"
    : kind === "runs" ? "runs_history"
    : null;

  if (!table) return [];

  let rows;
  if (period === "allTime") {
    const stmt = db.prepare(`
      SELECT user_id AS userId, SUM(quantity) AS total
      FROM ${table}
      GROUP BY user_id
      ORDER BY total DESC
      LIMIT 10
    `);
    rows = stmt.all();
  } else {
    const stmt = db.prepare(`
      SELECT user_id AS userId, SUM(quantity) AS total
      FROM ${table}
      WHERE timestamp >= ?
      GROUP BY user_id
      ORDER BY total DESC
      LIMIT 10
    `);
    rows = stmt.all(cutoff);
  }

  return rows;
}

// kind: "keys" or "runs"
function getUserStats(kind, userId) {
  const cutoff = sevenDaysAgoMs();

  if (kind === "keys") {
    const allTimeRow = db
      .prepare(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM keys_history WHERE user_id = ?"
      )
      .get(userId);
    const weeklyRow = db
      .prepare(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM keys_history WHERE user_id = ? AND timestamp >= ?"
      )
      .get(userId, cutoff);

    return {
      allTime: allTimeRow.total,
      weekly: weeklyRow.total,
    };
  }

  if (kind === "runs") {
    const allTimeRow = db
      .prepare(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM runs_history WHERE user_id = ?"
      )
      .get(userId);
    const weeklyRow = db
      .prepare(
        "SELECT COALESCE(SUM(quantity), 0) AS total FROM runs_history WHERE user_id = ? AND timestamp >= ?"
      )
      .get(userId, cutoff);

    const breakdownRows = db
      .prepare(
        "SELECT dungeon, SUM(quantity) AS total FROM runs_history WHERE user_id = ? AND timestamp >= ? GROUP BY dungeon ORDER BY total DESC"
      )
      .all(userId, cutoff);

    const breakdown = {};
    for (const row of breakdownRows) {
      breakdown[row.dungeon] = row.total;
    }

    return {
      allTime: allTimeRow.total,
      weekly: weeklyRow.total,
      breakdown,
    };
  }

  return { allTime: 0, weekly: 0 };
}

// -----------------------------
// Active runs (in memory)
// -----------------------------

// One active run per leaderId
// { leaderId, dungeon, partyName, channelId, messageId, createdAt }
const activeRuns = new Map();

function startRun(leaderId, runData) {
  activeRuns.set(leaderId, {
    ...runData,
    createdAt: Date.now(),
  });
}

function endRun(leaderId) {
  activeRuns.delete(leaderId);
}

function getActiveRun(leaderId) {
  return activeRuns.get(leaderId) || null;
}

module.exports = {
  // verification
  createVerificationSession,
  getPendingVerification,
  completeVerification,

  // logging
  logKeys,
  logRuns,
  getLeaderboard,
  getUserStats,

  // runs
  startRun,
  endRun,
  getActiveRun,
};
