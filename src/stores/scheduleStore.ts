import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage } from '../db/kvStorage';
import type { DoseLog } from '../types';

interface ScheduleState {
  /** Notification IDs keyed by medicationId */
  notificationIds: Record<string, string[]>;
  setNotificationIds: (medicationId: string, ids: string[]) => void;
  clearNotificationIds: (medicationId: string) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      notificationIds: {},

      setNotificationIds: (medicationId, ids) =>
        set((s) => ({
          notificationIds: { ...s.notificationIds, [medicationId]: ids },
        })),

      clearNotificationIds: (medicationId) =>
        set((s) => {
          const next = { ...s.notificationIds };
          delete next[medicationId];
          return { notificationIds: next };
        }),
    }),
    {
      name: 'schedule',
      storage: {
        getItem: (key) => {
          const value = kvStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => kvStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => kvStorage.removeItem(key),
      },
    }
  )
);

// ─── Dose log helpers (write directly to SQLite, not store) ───────────────────
// These are utility functions — see src/db/doseLog.ts
