# ⚠️ ÉTAPE 6 — Système d'Alertes Macro

> **Objectif** : Système de notifications temps réel pour les événements critiques : séismes importants, alertes météo extrêmes, incidents boursiers, zones de conflit actives.

**Durée estimée** : 1-2 jours  
**Dépendances** : [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md) + [ETAPE_4_COUCHES_DATA.md](./ETAPE_4_COUCHES_DATA.md)  
**Suivant** : [ETAPE_7_UI_PANELS.md](./ETAPE_7_UI_PANELS.md)

---

## ✅ Checklist de Validation

- [ ] Alerte apparaît < 5 secondes après un séisme M5+
- [ ] Bandeau d'alerte rouge en haut de l'interface
- [ ] Clic sur alerte → globe fly-to vers l'épicentre
- [ ] Les alertes ont une priorité (CRITICAL / HIGH / MEDIUM)
- [ ] Alertes persistées en SQLite pour historique
- [ ] Pastille de compte dans l'icône alertes du header
- [ ] Notification browser (Notification API) si l'onglet est inactif

---

## 6.1 — Modèle d'Alerte

```python
# backend/models/alert.py
from datetime import datetime
from typing import Optional, Literal
from sqlmodel import SQLModel, Field

AlertLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
AlertCategory = Literal["seismic", "weather", "market", "conflict", "news"]

class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    level: AlertLevel
    category: AlertCategory
    title: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False

class AlertCreate(SQLModel):
    level: AlertLevel
    category: AlertCategory
    title: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
```

---

## 6.2 — Service de Génération d'Alertes

```python
# backend/services/alert_service.py
import logging
from sqlmodel import Session, select
from models.alert import Alert, AlertCreate, AlertLevel
from db import engine

logger = logging.getLogger(__name__)

SEISMIC_THRESHOLDS: dict[float, AlertLevel] = {
    7.0: "CRITICAL",
    6.0: "HIGH",
    5.0: "MEDIUM",
    4.0: "LOW",
}

async def process_seismic_events(earthquakes: list, ws_manager) -> list[Alert]:
    """Crée des alertes pour les séismes importants."""
    new_alerts = []
    
    with Session(engine) as session:
        for eq in earthquakes:
            if eq["magnitude"] < 4.0:
                continue
            
            # Vérifier si déjà alerté
            existing = session.exec(
                select(Alert).where(Alert.source_url == eq["url"])
            ).first()
            if existing:
                continue
            
            # Déterminer le niveau
            level: AlertLevel = "LOW"
            for threshold, lvl in sorted(SEISMIC_THRESHOLDS.items(), reverse=True):
                if eq["magnitude"] >= threshold:
                    level = lvl
                    break
            
            alert = Alert(
                level=level,
                category="seismic",
                title=f"🔴 Séisme M{eq['magnitude']} — {eq['place']}",
                description=f"Magnitude {eq['magnitude']} à {eq['depth']}km de profondeur",
                latitude=eq["latitude"],
                longitude=eq["longitude"],
                source_url=eq["url"],
            )
            session.add(alert)
            session.commit()
            session.refresh(alert)
            
            new_alerts.append(alert)
            logger.info(f"Alert créée: {alert.title}")
    
    # Broadcast les nouvelles alertes
    if new_alerts and ws_manager:
        await ws_manager.broadcast({
            "type": "alerts",
            "data": [a.dict() for a in new_alerts]
        })
    
    return new_alerts

async def process_market_crash(markets: list, ws_manager):
    """Alerte si un marché majeur chute de plus de 3%."""
    for market in markets:
        if market.get("change_pct", 0) <= -3.0:
            await ws_manager.broadcast({
                "type": "alerts",
                "data": [{
                    "level": "HIGH",
                    "category": "market",
                    "title": f"📉 Crash marché — {market['country']} {market['change_pct']}%",
                    "description": f"{market['symbol']} en baisse de {abs(market['change_pct'])}%",
                }]
            })
```

---

## 6.3 — Store Alertes Frontend

```javascript
// frontend/src/stores/alertsStore.js
import { create } from 'zustand'

export const useAlertsStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlerts: (newAlerts) => set((state) => {
    const all = [...newAlerts.reverse(), ...state.alerts].slice(0, 100) // max 100
    const unread = all.filter(a => !a.read).length
    
    // Notification browser si onglet inactif
    if (document.hidden && newAlerts.some(a => a.level === 'CRITICAL')) {
      new Notification('⚠️ HELIOS — Alerte Critique', {
        body: newAlerts[0].title,
        icon: '/favicon.ico',
      })
    }
    
    return { alerts: all, unreadCount: unread }
  }),

  addSeismicAlerts: (earthquakes) => {
    const alerts = earthquakes
      .filter(e => e.magnitude >= 5)
      .map(e => ({
        id: e.id,
        level: e.magnitude >= 7 ? 'CRITICAL' : e.magnitude >= 6 ? 'HIGH' : 'MEDIUM',
        category: 'seismic',
        title: `🔴 Séisme M${e.magnitude} — ${e.place}`,
        latitude: e.latitude,
        longitude: e.longitude,
        read: false,
        timestamp: new Date().toISOString(),
      }))
    
    if (alerts.length > 0) get().addAlerts(alerts)
  },

  markAsRead: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => a.id === alertId ? { ...a, read: true } : a),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  clearAll: () => set({ alerts: [], unreadCount: 0 }),
}))
```

---

## 6.4 — Composant Bandeau d'Alertes

```jsx
// frontend/src/components/Alerts/AlertBanner.jsx
import { useEffect } from 'react'
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
  const { alerts, markAsRead } = useAlertsStore()
  const { viewer } = useGlobeStore()

  // Demander permission notifications au démarrage
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const latestAlerts = alerts.filter(a => !a.read).slice(0, 3)
  if (latestAlerts.length === 0) return null

  const flyToAlert = (alert) => {
    if (viewer && alert.latitude && alert.longitude) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          alert.longitude, alert.latitude, 1000000
        ),
        duration: 2,
      })
    }
    markAsRead(alert.id)
  }

  return (
    <div className={styles.banner} role="alertdialog" aria-live="polite">
      {latestAlerts.map(alert => (
        <button
          key={alert.id}
          className={styles.alert}
          style={{ borderLeftColor: LEVEL_COLORS[alert.level] }}
          onClick={() => flyToAlert(alert)}
          aria-label={alert.title}
        >
          <span className={styles.level}>{alert.level}</span>
          <span className={styles.title}>{alert.title}</span>
          <span className={styles.time}>
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </button>
      ))}
    </div>
  )
}
```

```css
/* AlertBanner.module.css */
.banner {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1000;
  pointer-events: all;
}

.alert {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-left: 4px solid;
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: transform 0.2s;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  text-align: left;
  
  animation: slideDown 0.3s ease-out;
}

.alert:hover {
  transform: scale(1.02);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.level {
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: bold;
  opacity: 0.8;
}

.title {
  font-size: 13px;
  flex: 1;
}

.time {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}
```

> ✅ Système d'alertes temps réel → Passer à [ETAPE_7_UI_PANELS.md](./ETAPE_7_UI_PANELS.md)
