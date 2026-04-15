import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  isMobileOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  isMobileOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
}));
