import { lazy, Suspense } from 'react'
import { usePanelStore } from '../../stores/panelStore'
import styles from './PanelContainer.module.css'

// Lazy load panels
const NewsPanel = lazy(() => import('./NewsPanel'))
const FinancePanel = lazy(() => import('./FinancePanel'))
const AlertsPanel = lazy(() => import('./AlertsPanel'))

const PANEL_MAP = {
  news: NewsPanel,
  finance: FinancePanel,
  alerts: AlertsPanel,
}

const PANEL_TITLES = {
  news: '📰 News en Direct',
  finance: '💹 Marchés Mondiaux',
  alerts: '⚠️ Historique Alertes',
  cctv: '📷 Flux CCTV',
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
        Chargement...
      </span>
    </div>
  )
}

export default function PanelContainer() {
  const { activePanel, closePanel } = usePanelStore()

  if (!activePanel || activePanel === 'cctv') return null

  const PanelContent = PANEL_MAP[activePanel]

  return (
    <aside
      className={styles.container}
      aria-label={PANEL_TITLES[activePanel] || 'Panel'}
    >
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{PANEL_TITLES[activePanel]}</h2>
        <button
          className={styles.closeBtn}
          onClick={closePanel}
          aria-label="Fermer le panel"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        <Suspense fallback={<Spinner />}>
          {PanelContent && <PanelContent />}
        </Suspense>
      </div>
    </aside>
  )
}
