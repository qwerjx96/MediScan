import { getDb } from './database';
import type { DoseLog } from '../types';

function rowToDoseLog(row: {
  id: string;
  medication_id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: string;
}): DoseLog {
  return {
    id: row.id,
    medicationId: row.medication_id,
    scheduledAt: row.scheduled_at,
    takenAt: row.taken_at,
    status: row.status as DoseLog['status'],
  };
}

export async function insertDoseLog(log: DoseLog): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO dose_log (id, medication_id, scheduled_at, taken_at, status)
     VALUES (?, ?, ?, ?, ?)`,
    [log.id, log.medicationId, log.scheduledAt, log.takenAt, log.status]
  );
}

export async function updateDoseLog(
  id: string,
  update: Partial<Pick<DoseLog, 'takenAt' | 'status'>>
): Promise<void> {
  const db = getDb();
  if (update.takenAt !== undefined && update.status !== undefined) {
    await db.runAsync(
      'UPDATE dose_log SET taken_at = ?, status = ? WHERE id = ?',
      [update.takenAt, update.status, id]
    );
  } else if (update.status !== undefined) {
    await db.runAsync('UPDATE dose_log SET status = ? WHERE id = ?', [
      update.status,
      id,
    ]);
  }
}

export async function getDoseLogsForDate(dateISO: string): Promise<DoseLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: string;
    medication_id: string;
    scheduled_at: string;
    taken_at: string | null;
    status: string;
  }>(
    `SELECT * FROM dose_log
     WHERE scheduled_at >= ? AND scheduled_at < ?
     ORDER BY scheduled_at ASC`,
    [`${dateISO}T00:00:00.000Z`, `${dateISO}T23:59:59.999Z`]
  );
  return rows.map(rowToDoseLog);
}

export async function getDoseLogsForMedication(
  medicationId: string,
  limit = 30
): Promise<DoseLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: string;
    medication_id: string;
    scheduled_at: string;
    taken_at: string | null;
    status: string;
  }>(
    `SELECT * FROM dose_log
     WHERE medication_id = ?
     ORDER BY scheduled_at DESC
     LIMIT ?`,
    [medicationId, limit]
  );
  return rows.map(rowToDoseLog);
}
