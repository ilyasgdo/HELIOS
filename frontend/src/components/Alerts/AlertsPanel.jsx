import { useAlertsStore } from '../../stores/alertsStore'
import { usePanelStore } from '../../stores/panelStore'
import { useGlobeStore } from '../../stores/globeStore'
import * as CesiumLib from 'cesium'
import styles from './AlertsPanel.module.css'

const LEVEL_COLORS = {
  CRITICAL: '#ff2222',
  HIGH: '#ff8800',
  MEDIUM: '#ffdd00',
  LOW: '#4488ff',
}

const CATEGORY_ICONS = {
  seismic: '⚡',
  weather: '🌪️',
  market: '📉',
  conflict: '🔴',
  news: '📰',
}

export default function AlertsPanel() {
  const { activePanel, togglePanel } = usePanelStore()
  const { alerts, markAsRead, clearAll } = useAlertsStore()
  const { viewer } = useGlobeStore()

  if (activePanel !== 'alerts') return null

  const flyToAlert = (alert) => {
    if (viewer && alert.latitude && alert.longitude) {
      viewer.camera.flyTo({
        destination: CesiumLib.Cartesian3.fromDegrees(
          alert.longitude, alert.latitude, 1000000 
        ),
        duration: 2,
      })
    }
    // Marquer lue dans ts les cas
    if (!alert.read) markAsRead(alert.id)
  }

  return (
    <div className={styles.panel} role="complementary" aria-label="Historique des Alertes">
      <div className={styles.header}>
        <h2><span className={styles.icon}>⚠️</span> Alertes Système</h2>
        <div className={styles.actions}>
          {alerts.length > 0 && (
            <button className={styles.clearBtn} onClick={clearAll}>Effacer</button>
          )}
          <button className={styles.closeBtn} onClick={() => togglePanel(null)}>✕</button>
        </div>
      </div>

      <div className={styles.content}>
        {alerts.length === 0 ? (
          <div className={styles.empty}>Aucune alerte enregistrée.</div>
        ) : (
          <ul className={styles.list}>
            {alerts.map(alert => (
              <li 
                key={alert.id} 
                className={`${styles.item} ${!alert.read ? styles.unread : ''}`}
                onClick={() => flyToAlert(alert)}
                style={{ borderLeftColor: LEVEL_COLORS[alert.level] || LEVEL_COLORS.LOW }}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.category}>
                    {CATEGORY_ICONS[alert.category] || '⚠️'} {alert.category.toUpperCase()}
                  </span>
                  <span className={styles.time}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <h3 className={styles.itemTitle}>{alert.title}</h3>
                <p className={styles.itemDesc}>{alert.description}</p>
                
                <div className={styles.itemFooter}>
                  <span className={styles.level} style={{ color: LEVEL_COLORS[alert.level] || LEVEL_COLORS.LOW }}>
                    [{alert.level}]
                  </span>
                  {alert.source_url && (
                    <a 
                       href={alert.source_url} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className={styles.source}
                       onClick={(e) => e.stopPropagation()}
                    >
                      Détails ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
