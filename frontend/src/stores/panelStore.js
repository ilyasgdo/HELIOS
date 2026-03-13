import { create } from 'zustand'

export const usePanelStore = create((set) => ({
  activePanel: null, // 'news' | 'finance' | 'alerts' | 'cctv' | null

  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),
}))
