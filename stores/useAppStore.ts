import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  isInitialized: boolean;
  enablePOSScanner: boolean;
  setEnablePOSScanner: (enable: boolean) => void;
  setIsInitialized: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isInitialized: false,
      enablePOSScanner: false,
      setEnablePOSScanner: (enable) => set({ enablePOSScanner: enable }),
      setIsInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'pharm-erp-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
