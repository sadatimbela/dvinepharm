import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  pharmacyName: string;
  currency: string;
  lowStockThreshold: number;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      pharmacyName: 'PharmERP',
      currency: 'TZS',
      lowStockThreshold: 10,
      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'pharm-erp-settings',
    }
  )
);
