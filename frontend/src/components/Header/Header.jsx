import { usePanelStore } from '../../stores/panelStore'
import { useAlertsStore } from '../../stores/alertsStore'
import { useGlobeStore } from '../../stores/globeStore'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { id: 'finance', icon: '💹', label: 'Finance' },
  { id: 'news', icon: '📰', label: 'News' },
  { id: 'alerts', icon: '⚠️', label: 'Alertes' },
]

export default function Header() {
  const { activePanel, togglePanel } = usePanelStore()
  const { unreadCount } = useAlertsStore()
  const { activeLayers, toggleLayer } = useGlobeStore()

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
        {NAV_ITEMS.map(({ id, icon, label }) => {
          // Gérer le toggle pour fermer si déjà ouvert
          const handleToggle = () => {
             if (activePanel === id) {
               togglePanel(null)
             } else {
               togglePanel(id)
             }
          }

          return (
            <button
              key={id}
              className={`${styles.navBtn} ${activePanel === id ? styles.active : ''}`}
              onClick={handleToggle}
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
          )
        })}

        {/* Bouton CCTV séparé pointant vers la visibilité de la couche */}
        <button
          className={`${styles.navBtn} ${activeLayers.cctv ? styles.active : ''}`}
          onClick={() => toggleLayer('cctv')}
          aria-label="Toggle couche CCTV"
          aria-pressed={activeLayers.cctv}
        >
          <span>📷</span>
          <span className={styles.btnLabel}>CCTV Map</span>
        </button>
      </nav>
    </header>
  )
}
