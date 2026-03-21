import { useGlobeStore } from '../../stores/globeStore'
import styles from './LayerToolbar.module.css'

const LAYERS = [
  { key: 'aviation',  icon: '✈️',  label: 'Aviation',  color: '#00d4ff' },
  { key: 'conflicts', icon: '🔴',  label: 'Conflits',  color: '#ff3d3d' },
  { key: 'seismic',   icon: '⚡',  label: 'Séismes',   color: '#ffaa00' },
  { key: 'news',      icon: '📰',  label: 'News',      color: '#4488ff' },
  { key: 'finance',   icon: '💹',  label: 'Marchés',   color: '#00ff88' },
  { key: 'cctv',      icon: '📷',  label: 'CCTV',      color: '#00ffcc' },
]

export default function LayerToolbar() {
  const { activeLayers, toggleLayer } = useGlobeStore()

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Couches du globe">
      {LAYERS.map(({ key, icon, label, color }) => {
        const isActive = activeLayers[key]
        return (
          <button
            key={key}
            className={`${styles.btn} ${isActive ? styles.active : ''}`}
            style={isActive ? { borderColor: color, color: color } : {}}
            onClick={() => toggleLayer(key)}
            aria-label={`${isActive ? 'Désactiver' : 'Activer'} la couche ${label}`}
            aria-pressed={isActive}
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
            {isActive && (
              <span
                className={styles.dot}
                style={{ background: color }}
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
