import { useCallback } from 'react'
import { useAlertsStore } from '../../stores/alertsStore'
import { useGlobeStore } from '../../stores/globeStore'
import styles from './AlertBanner.module.css'

const LEVEL_CONFIG = {
  CRITICAL: { color: '#ff3d3d', label: 'CRITIQUE' },
  HIGH: { color: '#ff8800', label: 'ÉLEVÉ' },
  MEDIUM: { color: '#ffaa00', label: 'MOYEN' },
  LOW: { color: '#4488ff', label: 'BAS' },
}

export default function AlertBanner() {
  const { alerts, markAsRead } = useAlertsStore()
  const { viewer } = useGlobeStore()

  // Seulement les 3 premières alertes non lues
  const visibleAlerts = alerts.filter((a) => !a.read).slice(0, 3)

  const handleClick = useCallback(
    (alert) => {
      // Fly-to vers l'épicentre si coordonnées disponibles
      if (viewer && alert.latitude != null && alert.longitude != null) {
        viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(
            alert.longitude,
            alert.latitude,
            2000000,
          ),
          duration: 2.5,
        })
      }
      markAsRead(alert.id)
    },
    [viewer, markAsRead],
  )

  if (visibleAlerts.length === 0) return null

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      {visibleAlerts.map((alert) => {
        const config = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.LOW
        return (
          <button
            key={alert.id}
            className={styles.alert}
            style={{ borderLeftColor: config.color }}
            onClick={() => handleClick(alert)}
            aria-label={`Alerte ${config.label}: ${alert.title}. Cliquer pour localiser.`}
          >
            <span className={styles.level} style={{ color: config.color }}>
              {config.label}
            </span>
            <span className={styles.title}>{alert.title}</span>
            {alert.latitude && (
              <span className={styles.locate}>📍 Localiser</span>
            )}
            <span className={styles.time}>
              {new Date(alert.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
