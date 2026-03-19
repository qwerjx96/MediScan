import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { kvStorage } from '../db/kvStorage';

interface AppState {
  /** ISO 3166-1 alpha-2 user locale (e.g. 'US', 'MY') */
  userRegion: string;
  /** Whether user has consented to Gemini Vision AI calls */
  geminiConsented: boolean;
  /** Whether onboarding is complete */
  onboardingDone: boolean;
  setUserRegion: (region: string) => void;
  setGeminiConsented: (v: boolean) => void;
  setOnboardingDone: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRegion: 'US',
      geminiConsented: false,
      onboardingDone: false,
      setUserRegion: (userRegion) => set({ userRegion }),
      setGeminiConsented: (geminiConsented) => set({ geminiConsented }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
    }),
    {
      name: 'app',
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
