import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage } from '../db/kvStorage';
import type { Medication } from '../types';

interface CabinetState {
  medications: Medication[];
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  removeMedication: (id: string) => void;
  getMedication: (id: string) => Medication | undefined;
}

export const useCabinetStore = create<CabinetState>()(
  persist(
    (set, get) => ({
      medications: [],

      addMedication: (med) =>
        set((s) => ({ medications: [...s.medications, med] })),

      updateMedication: (id, updates) =>
        set((s) => ({
          medications: s.medications.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMedication: (id) =>
        set((s) => ({
          medications: s.medications.filter((m) => m.id !== id),
        })),

      getMedication: (id) => get().medications.find((m) => m.id === id),
    }),
    {
      name: 'cabinet',
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
