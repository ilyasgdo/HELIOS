import { create } from 'zustand'

export const useGlobeStore = create((set) => ({
  // Instance Cesium Viewer
  viewer: null,
  setViewer: (viewer) => set({ viewer }),

  // Couches actives
  activeLayers: {
    satellite: true,
    aviation: false,
    conflicts: false,
    traffic: false,
    finance: false,
    news: false,
    macro: false,
    orbital: false,
    cctv: false,
    seismic: false,
  },
  toggleLayer: (layerName) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layerName]: !state.activeLayers[layerName],
      },
    })),

  // Données des couches
  aviationData: [],
  newsData: [],
  financeData: [],
  seismicData: [],

  updateAviationData: (data) => set({ aviationData: data }),
  updateNewsData: (data) => set({ newsData: data }),
  updateFinanceData: (data) => set({ financeData: data }),
  updateSeismicData: (data) => set({ seismicData: data }),
}))
