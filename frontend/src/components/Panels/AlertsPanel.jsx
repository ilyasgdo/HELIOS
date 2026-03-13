import { useAlertsStore } from '../../stores/alertsStore'
import { useGlobeStore } from '../../stores/globeStore'
import styles from './AlertsPanel.module.css'

const LEVEL_CONFIG = {
  CRITICAL: { color: '#ff3d3d', label: '🔴 CRITIQUE' },
  HIGH:     { color: '#ff8800', label: '🟠 ÉLEVÉ' },
  MEDIUM:   { color: '#ffaa00', label: '🟡 MOYEN' },
  LOW:      { color: '#4488ff', label: '🔵 BAS' },
}

export default function AlertsPanel() {
  const { alerts, markAllRead } = useAlertsStore()
  const { viewer } = useGlobeStore()

  const flyTo = (alert) => {
    if (!viewer || alert.latitude == null) return
    viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(
        alert.longitude,
        alert.latitude,
        2000000,
      ),
      duration: 2,
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{alerts.length} alerte(s)</span>
        {alerts.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={markAllRead}
            aria-label="Marquer tout comme lu"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className={styles.empty}>
          <span>✅</span>
          <p>Aucune alerte active</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {alerts.map((alert, i) => {
            const cfg = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.LOW
            return (
              <li
                key={alert.id || i}
                className={`${styles.item} ${alert.read ? styles.read : ''}`}
                style={{ borderLeftColor: cfg.color }}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.level} style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className={styles.time}>
                    {new Date(alert.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className={styles.title}>{alert.title}</p>
                {alert.description && (
                  <p className={styles.desc}>{alert.description}</p>
                )}
                {alert.latitude != null && (
                  <button
                    className={styles.flyBtn}
                    onClick={() => flyTo(alert)}
                    aria-label="Aller à la localisation"
                  >
                    📍 Localiser sur le globe
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
