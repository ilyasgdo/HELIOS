import { usePanelStore } from '../../stores/panelStore'
import { useAlertsStore } from '../../stores/alertsStore'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { id: 'finance', icon: '💹', label: 'Finance' },
  { id: 'news', icon: '📰', label: 'News' },
  { id: 'alerts', icon: '⚠️', label: 'Alertes' },
  { id: 'cctv', icon: '📷', label: 'CCTV' },
]

const LAYER_ITEMS = [
  { id: 'aviation', icon: '✈️', label: 'Aviation' },
  { id: 'conflicts', icon: '🔴', label: 'Conflits' },
  { id: 'seismic', icon: '⚡', label: 'Séismes' },
]

export default function Header() {
  const { activePanel, togglePanel } = usePanelStore()
  const { unreadCount } = useAlertsStore()

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <div className={styles.logoText}>
          <span className={styles.logoName}>HELIOS</span>
          <span className={styles.logoSub}>GLOBAL TERMINAL</span>
        </div>
      </div>

      {/* Status en ligne */}
      <div className={styles.status}>
        <span className={styles.dot} />
        <span className={styles.statusText}>LIVE</span>
      </div>

      {/* Navigation panels */}
      <nav className={styles.nav} role="navigation" aria-label="Panels">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`${styles.navBtn} ${activePanel === id ? styles.active : ''}`}
            onClick={() => togglePanel(id)}
            aria-label={`Ouvrir ${label}`}
            aria-pressed={activePanel === id}
          >
            <span>{icon}</span>
            <span className={styles.btnLabel}>{label}</span>
            {id === 'alerts' && unreadCount > 0 && (
              <span className={styles.badge} aria-label={`${unreadCount} alertes non lues`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </header>
  )
}
