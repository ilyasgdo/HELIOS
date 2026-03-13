import { create } from 'zustand'

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlerts: (newAlerts) =>
    set((state) => {
      const all = [...newAlerts, ...state.alerts].slice(0, 100)
      const unread = all.filter((a) => !a.read).length

      // Notification browser si onglet inactif et alerte critique
      if (
        document.hidden &&
        newAlerts.some((a) => a.level === 'CRITICAL') &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('⚠️ HELIOS — Alerte Critique', {
          body: newAlerts[0]?.title,
          icon: '/favicon.svg',
        })
      }

      return { alerts: all, unreadCount: unread }
    }),

  addSeismicAlerts: (earthquakes) => {
    const alerts = (earthquakes || [])
      .filter((e) => e.magnitude >= 5)
      .map((e) => ({
        id: e.id,
        level:
          e.magnitude >= 7 ? 'CRITICAL' : e.magnitude >= 6 ? 'HIGH' : 'MEDIUM',
        category: 'seismic',
        title: `🔴 Séisme M${e.magnitude} — ${e.place}`,
        description: `Profondeur: ${e.depth}km`,
        latitude: e.latitude,
        longitude: e.longitude,
        url: e.url,
        read: false,
        timestamp: new Date().toISOString(),
      }))

    if (alerts.length > 0) get().addAlerts(alerts)
  },

  markAsRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, read: true } : a,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
}))
