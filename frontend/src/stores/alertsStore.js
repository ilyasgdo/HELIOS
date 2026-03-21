import { create } from 'zustand'

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,

  // Ajoute un tableau d'alertes au store (venant du WS ou du fetch initial)
  addAlerts: (newAlerts) => set((state) => {
    // Évite les doublons par ID
    const existingIds = new Set(state.alerts.map(a => a.id))
    const filteredNew = newAlerts.filter(a => !existingIds.has(a.id))
    
    if (filteredNew.length === 0) return state

    const all = [...filteredNew, ...state.alerts].slice(0, 100) // garde les 100 dernières
    const unread = all.filter(a => !a.read).length
    
    // Notification browser si l'onglet est inactif et qu'il y a une alerte CRITICAL ou HIGH
    if (document.hidden && filteredNew.some(a => a.level === 'CRITICAL' || a.level === 'HIGH')) {
      try {
        new Notification('⚠️ HELIOS — Alerte Critique', {
          body: filteredNew[0].title,
          icon: '/vite.svg',
        })
      } catch (e) {
        console.warn('Notifications non autorisées', e)
      }
    }
    
    return { alerts: all, unreadCount: unread }
  }),

  // Appel async (vers l'API) pour marquer l'alerte comme lue en base + maj locale
  markAsRead: async (alertId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      })
    } catch(e) { console.error('Erreur acknowledge api', e) }

    set((state) => {
      const updated = state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a)
      const count = updated.filter(a => !a.read).length
      return { alerts: updated, unreadCount: count }
    })
  },

  // Utilisé au chargement pour hydrater le store
  fetchInitialAlerts: async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts?limit=50`)
      if (res.ok) {
        const data = await res.json()
        // On map "acknowledged" de la BDD vers "read" côté front
        const mapped = data.map(a => ({ ...a, read: a.acknowledged, timestamp: a.created_at }))
        get().addAlerts(mapped)
      }
    } catch(e) {
      console.error('Erreur fetch initial alerts', e)
    }
  },

  clearAll: () => set({ alerts: [], unreadCount: 0 }),
}))
