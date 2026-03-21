import { create } from 'zustand'

export const usePanelStore = create((set) => ({
  activePanel: null, // 'news' | 'finance' | 'alerts' | 'cctv' | 'cctvPlayer'
  selectedCctv: null,

  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null, selectedCctv: null }),
  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
      selectedCctv: state.activePanel === panel ? null : state.selectedCctv
    })),
  openCctvPlayer: (camData) => set({ activePanel: 'cctvPlayer', selectedCctv: camData })
}))
