/**
 * A synchronous KV storage adapter backed by the SQLite `kv_store` table.
 * Zustand's `persist` middleware requires a synchronous-looking interface
 * (getItem / setItem / removeItem), so we pre-load the table into an in-memory
 * Map on startup and flush writes asynchronously.
 */
import { getDb } from './database';

const cache = new Map<string, string>();
let ready = false;

export async function loadKvCache(): Promise<void> {
  if (ready) return;
  const db = getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM kv_store'
  );
  for (const row of rows) {
    cache.set(row.key, row.value);
  }
  ready = true;
}

export const kvStorage = {
  getItem: (key: string): string | null => cache.get(key) ?? null,

  setItem: (key: string, value: string): void => {
    cache.set(key, value);
    // fire-and-forget
    void getDb().runAsync(
      'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
      [key, value]
    );
  },

  removeItem: (key: string): void => {
    cache.delete(key);
    void getDb().runAsync('DELETE FROM kv_store WHERE key = ?', [key]);
  },
};
