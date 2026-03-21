import { useEffect } from 'react'
import * as CesiumLib from 'cesium'
import { useAlertsStore } from '../../stores/alertsStore'
import { useGlobeStore } from '../../stores/globeStore'
import styles from './AlertBanner.module.css'

const LEVEL_COLORS = {
  CRITICAL: '#ff2222',
  HIGH: '#ff8800',
  MEDIUM: '#ffdd00',
  LOW: '#4488ff',
}

export default function AlertBanner() {
  const { alerts, markAsRead, fetchInitialAlerts } = useAlertsStore()
  const { viewer } = useGlobeStore()

  // Au chargement du composant, demander la permission des notifications OS
  // et loader l'historique depuis SQLite
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    fetchInitialAlerts()
  }, [])

  // N'afficher dans le bandeau central que les 3 dernières alertes NON LUES
  const latestAlerts = alerts.filter(a => !a.read).slice(0, 3)
  
  if (latestAlerts.length === 0) return null

  // Fly-to global : pivote le globe vers l'anomalie
  const flyToAlert = (alert) => {
    if (viewer && alert.latitude && alert.longitude) {
      viewer.camera.flyTo({
        destination: CesiumLib.Cartesian3.fromDegrees(
          alert.longitude, alert.latitude, 1000000 // 1000km altitude
        ),
        duration: 2,
      })
    }
    // Marquer lu côté Front (Zustand) & Back (POST /acknowledge)
    markAsRead(alert.id)
  }

  return (
    <div className={styles.banner} role="alertdialog" aria-live="polite">
      {latestAlerts.map(alert => (
        <button
          key={alert.id}
          className={styles.alert}
          style={{ borderLeftColor: LEVEL_COLORS[alert.level] || LEVEL_COLORS.LOW }}
          onClick={() => flyToAlert(alert)}
          aria-label={alert.title}
        >
          <span className={styles.level} style={{ color: LEVEL_COLORS[alert.level] || LEVEL_COLORS.LOW }}>
            {alert.level}
          </span>
          <span className={styles.title}>{alert.title}</span>
          <span className={styles.time}>
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </button>
      ))}
    </div>
  )
}
