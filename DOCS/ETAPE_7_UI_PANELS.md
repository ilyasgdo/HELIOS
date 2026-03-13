# 🖥️ ÉTAPE 7 — Panels Latéraux UI

> **Objectif** : Construire les 4 panels latéraux droits (News, Marchés, OSINT/Search, Alertes) et la barre de navigation supérieure avec l'état global.

**Durée estimée** : 2-3 jours  
**Dépendances** : [ETAPE_4_COUCHES_DATA.md](./ETAPE_4_COUCHES_DATA.md) + [ETAPE_6_ALERTES.md](./ETAPE_6_ALERTES.md)  
**Suivant** : [ETAPE_8_POLISH_DEPLOY.md](./ETAPE_8_POLISH_DEPLOY.md)

---

## ✅ Checklist de Validation

- [ ] Header : barre de nav avec onglets Finance / Alertes / Satellites / News
- [ ] Panel News : 10 derniers articles avec pays, date, lien
- [ ] Panel Finance : marchés par pays avec indicateur +/- coloré
- [ ] Panel OSINT/Search : barre de recherche CLI avec résultats
- [ ] Panel Alertes : historique des alertes avec filtres par niveau
- [ ] Panels s'ouvrent/ferment avec animation smooth
- [ ] Responsive : panels se réduisent sur petits écrans

---

## 7.1 — Layout Principal

```
┌────────────────────────────────────────────────────────────┐
│ [🔍 Search] [💹 Finance] [⚠️ Alertes] [🛰️ Sat] [📷 CCTV]  │ ← Header Nav
├────────────────────────────────────────────────────────────┤
│                                                            │
│              GLOBE 3D (plein écran)          ┌──────────┐ │
│                                              │  PANEL   │ │
│                                              │ (340px)  │ │
│                                              │          │ │
│                                              └──────────┘ │
├────────────────────────────────────────────────────────────┤
│ BANDEAU ALERTES (si actif)                                 │
└────────────────────────────────────────────────────────────┘
```

---

## 7.2 — Store UI / Panels

```javascript
// frontend/src/stores/panelStore.js
import { create } from 'zustand'

const PANELS = ['news', 'finance', 'alerts', 'search', 'cctv']

export const usePanelStore = create((set) => ({
  activePanel: null,  // null = aucun panel ouvert

  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) => set((state) => ({
    activePanel: state.activePanel === panel ? null : panel
  })),
}))
```

---

## 7.3 — Navigation Header

```jsx
// frontend/src/components/Header/Header.jsx
import { usePanelStore } from '../../stores/panelStore'
import { useAlertsStore } from '../../stores/alertsStore'
import SearchBar from '../Search/SearchBar'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { id: 'finance', icon: '💹', label: 'Finance' },
  { id: 'news', icon: '📰', label: 'News' },
  { id: 'alerts', icon: '⚠️', label: 'Alertes' },
  { id: 'cctv', icon: '📷', label: 'CCTV' },
]

export default function Header() {
  const { activePanel, togglePanel } = usePanelStore()
  const { unreadCount } = useAlertsStore()

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>⬡ HELIOS</span>
        <span className={styles.logoSub}>GLOBAL TERMINAL</span>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Navigation */}
      <nav className={styles.nav} role="navigation">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`${styles.navBtn} ${activePanel === id ? styles.active : ''}`}
            onClick={() => togglePanel(id)}
            aria-label={label}
            aria-pressed={activePanel === id}
          >
            <span>{icon}</span>
            <span className={styles.navLabel}>{label}</span>
            {id === 'alerts' && unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>
    </header>
  )
}
```

```css
/* Header.module.css */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 0 var(--space-lg);
  background: rgba(5, 11, 24, 0.90);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.logo { display: flex; align-items: baseline; gap: 8px; }
.logoText {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 3px;
}
.logoSub {
  font-size: 9px;
  color: var(--color-text-muted);
  letter-spacing: 2px;
}

.nav { display: flex; gap: 4px; margin-left: auto; }

.navBtn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.navBtn:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.navBtn.active {
  background: var(--color-accent-glow);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--color-danger);
  color: white;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 7.4 — Panel Container (slide-in)

```jsx
// frontend/src/components/Panels/PanelContainer.jsx
import { usePanelStore } from '../../stores/panelStore'
import NewsPanel from './NewsPanel'
import FinancePanel from './FinancePanel'
import AlertsPanel from './AlertsPanel'
import CCTVGrid from '../CCTV/CCTVGrid'
import styles from './PanelContainer.module.css'

const PANEL_COMPONENTS = {
  news: NewsPanel,
  finance: FinancePanel,
  alerts: AlertsPanel,
  cctv: CCTVGrid,
}

export default function PanelContainer() {
  const { activePanel, closePanel } = usePanelStore()

  if (!activePanel) return null

  const PanelContent = PANEL_COMPONENTS[activePanel]

  return (
    <aside className={styles.container} aria-label="Panel d'information">
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={closePanel} aria-label="Fermer">✕</button>
      </div>
      <div className={styles.content}>
        {PanelContent && <PanelContent />}
      </div>
    </aside>
  )
}
```

```css
/* PanelContainer.module.css */
.container {
  position: fixed;
  top: 52px;
  right: 0;
  width: 360px;
  height: calc(100vh - 52px);
  z-index: 50;
  background: rgba(13, 27, 46, 0.92);
  backdrop-filter: blur(16px);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.content { flex: 1; overflow-y: auto; padding: var(--space-md); }
```

---

## 7.5 — Panel News

```jsx
// frontend/src/components/Panels/NewsPanel.jsx
import { useGlobeStore } from '../../stores/globeStore'
import styles from './NewsPanel.module.css'

export default function NewsPanel() {
  const { newsData } = useGlobeStore()

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>📰 News en Direct</h2>
      {newsData.length === 0 ? (
        <p className={styles.empty}>Chargement des nouvelles...</p>
      ) : (
        <ul className={styles.list}>
          {newsData.slice(0, 15).map((article, i) => (
            <li key={i} className={styles.article}>
              <a href={article.link} target="_blank" rel="noopener noreferrer">
                <span className={styles.country}>{article.country?.toUpperCase()}</span>
                <span className={styles.headline}>{article.title}</span>
                <span className={styles.source}>{article.source} · {
                  new Date(article.pubDate).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit'
                  })
                }</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

## 7.6 — Panel Finance

```jsx
// frontend/src/components/Panels/FinancePanel.jsx
import { useGlobeStore } from '../../stores/globeStore'
import styles from './FinancePanel.module.css'

const FLAG_EMOJIS = {
  US: '🇺🇸', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵',
  GB: '🇬🇧', CN: '🇨🇳',
}

export default function FinancePanel() {
  const { financeData } = useGlobeStore()

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>💹 Marchés Mondiaux</h2>
      <ul className={styles.list}>
        {financeData.map((market) => (
          <li key={market.country} className={styles.row}>
            <span className={styles.flag}>{FLAG_EMOJIS[market.country] || '🌍'}</span>
            <span className={styles.symbol}>{market.symbol}</span>
            <span className={styles.price}>{market.price?.toLocaleString()}</span>
            <span
              className={styles.change}
              style={{ color: market.change_pct > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {market.change_pct > 0 ? '▲' : '▼'} {Math.abs(market.change_pct)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

> ✅ UI complète → Passer à [ETAPE_8_POLISH_DEPLOY.md](./ETAPE_8_POLISH_DEPLOY.md)
