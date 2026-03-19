import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  if (_db) return;

  _db = await SQLite.openDatabaseAsync('mediscan.db');

  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS kv_store (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_log (
      id             TEXT PRIMARY KEY NOT NULL,
      medication_id  TEXT NOT NULL,
      scheduled_at   TEXT NOT NULL,
      taken_at       TEXT,
      status         TEXT NOT NULL CHECK(status IN ('taken','missed','skipped'))
    );

    CREATE INDEX IF NOT EXISTS dose_log_medication_idx
      ON dose_log (medication_id);

    CREATE INDEX IF NOT EXISTS dose_log_scheduled_idx
      ON dose_log (scheduled_at);
  `);
}
