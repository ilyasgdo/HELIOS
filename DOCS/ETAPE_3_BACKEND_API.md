# ⚡ ÉTAPE 3 — Backend FastAPI + WebSocket + Scheduler

> **Objectif** : Avoir un backend robuste qui pull les APIs externes toutes les X secondes, stocke en cache SQLite, et pousse les mises à jour temps réel au frontend via WebSocket.

**Durée estimée** : 3-4 jours  
**Dépendances** : [ETAPE_1_SETUP.md](./ETAPE_1_SETUP.md) complétée  
**Suivant** : [ETAPE_4_COUCHES_DATA.md](./ETAPE_4_COUCHES_DATA.md)

---

## ✅ Checklist de Validation

- [ ] WebSocket se connecte depuis le frontend (ws://localhost:8000/ws)
- [ ] Le scheduler tourne sans erreurs dans les logs
- [ ] Les données avions OpenSky arrivent via WebSocket toutes les 30s
- [ ] SQLite cache les réponses des APIs
- [ ] Les données ont un TTL (données vieilles de +5min supprimées)
- [ ] Les routes `/api/*` retournent du JSON valide
- [ ] Les erreurs API sont gérées (catch + log, pas de crash serveur)
- [ ] `ruff check .` passe sans erreur

---

## 3.1 — WebSocket Manager

```python
# backend/websocket.py
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Gère toutes les connexions WebSocket actives."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connecté. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client déconnecté. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Envoie un message à tous les clients connectés."""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        # Nettoyer les connexions mortes
        self.active_connections -= disconnected

    async def send_to(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Erreur envoi message: {e}")
            self.disconnect(websocket)

# Instance globale (singleton)
manager = ConnectionManager()
```

---

## 3.2 — Route WebSocket dans main.py

```python
# backend/main.py (ajout)
from fastapi import WebSocket, WebSocketDisconnect
from websocket import manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Garder la connexion vivante, écouter les messages client
            data = await websocket.receive_text()
            # On peut gérer des commandes client ici si besoin
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

---

## 3.3 — Scheduler APScheduler

```python
# backend/scheduler.py
import logging
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

class HeliosScheduler:
    def __init__(self, ws_manager, db_session_factory):
        self.scheduler = AsyncIOScheduler()
        self.ws = ws_manager
        self.db = db_session_factory

    def start(self):
        # Avions — toutes les 30 secondes
        self.scheduler.add_job(
            self._fetch_aviation,
            IntervalTrigger(seconds=30),
            id='aviation',
            max_instances=1,
            replace_existing=True
        )

        # News — toutes les 5 minutes
        self.scheduler.add_job(
            self._fetch_news,
            IntervalTrigger(minutes=5),
            id='news',
            max_instances=1,
            replace_existing=True
        )

        # Finance — toutes les 2 minutes
        self.scheduler.add_job(
            self._fetch_finance,
            IntervalTrigger(minutes=2),
            id='finance',
            max_instances=1,
            replace_existing=True
        )

        # Séismes — toutes les minutes
        self.scheduler.add_job(
            self._fetch_seismic,
            IntervalTrigger(minutes=1),
            id='seismic',
            max_instances=1,
            replace_existing=True
        )

        self.scheduler.start()
        logger.info("Scheduler HELIOS démarré")

    async def _fetch_aviation(self):
        try:
            from routes.aviation import fetch_planes
            data = await fetch_planes()
            await self.ws.broadcast({
                "type": "aviation",
                "data": data,
                "timestamp": __import__('time').time()
            })
        except Exception as e:
            logger.error(f"Erreur fetch aviation: {e}")

    async def _fetch_news(self):
        try:
            from routes.news import fetch_latest_news
            data = await fetch_latest_news()
            await self.ws.broadcast({"type": "news", "data": data})
        except Exception as e:
            logger.error(f"Erreur fetch news: {e}")

    async def _fetch_finance(self):
        try:
            from routes.finance import fetch_global_markets
            data = await fetch_global_markets()
            await self.ws.broadcast({"type": "finance", "data": data})
        except Exception as e:
            logger.error(f"Erreur fetch finance: {e}")

    async def _fetch_seismic(self):
        try:
            from routes.weather import fetch_earthquakes
            data = await fetch_earthquakes()
            await self.ws.broadcast({"type": "seismic", "data": data})
        except Exception as e:
            logger.error(f"Erreur fetch seismic: {e}")
```

---

## 3.4 — Modèles SQLite (Cache)

```python
# backend/db.py
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, create_engine, Session, select
import os

class CachedData(SQLModel, table=True):
    """Stocke les réponses API en cache."""
    id: Optional[int] = Field(default=None, primary_key=True)
    source: str          # "opensky", "newsdata", "finnhub", etc.
    data: str            # JSON sérialisé
    fetched_at: datetime = Field(default_factory=datetime.utcnow)

class SeismicEvent(SQLModel, table=True):
    """Événements sismiques récents."""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(unique=True)
    magnitude: float
    place: str
    latitude: float
    longitude: float
    depth: float
    time: datetime
    url: str

DATABASE_URL = f"sqlite:///{os.getenv('DATABASE_URL', './helios.db')}"
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def clean_old_cache(source: str, max_age_minutes: int = 60):
    """Supprime le cache trop vieux."""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(minutes=max_age_minutes)
    with Session(engine) as session:
        old = session.exec(
            select(CachedData)
            .where(CachedData.source == source)
            .where(CachedData.fetched_at < cutoff)
        ).all()
        for item in old:
            session.delete(item)
        session.commit()
```

---

## 3.5 — Hook WebSocket Frontend

```javascript
// frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react'
import { useGlobeStore } from '../stores/globeStore'
import { useAlertsStore } from '../stores/alertsStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimeout = useRef(null)

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data)
      dispatchToStore(message)
    } catch (e) {
      console.error('WS parse error:', e)
    }
  }, [])

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => console.info('[WS] Connecté au serveur HELIOS')
      ws.onmessage = handleMessage
      ws.onclose = () => {
        console.warn('[WS] Déconnecté. Reconnexion dans 3s...')
        reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY)
      }
      ws.onerror = (err) => console.error('[WS] Erreur:', err)

      wsRef.current = ws
    } catch (e) {
      console.error('[WS] Impossible de se connecter:', e)
    }
  }, [handleMessage])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}

function dispatchToStore(message) {
  // Router les messages vers les bons stores
  switch (message.type) {
    case 'aviation':
      useGlobeStore.getState().updateAviationData(message.data)
      break
    case 'news':
      useGlobeStore.getState().updateNewsData(message.data)
      break
    case 'finance':
      useGlobeStore.getState().updateFinanceData(message.data)
      break
    case 'seismic':
      useAlertsStore.getState().addSeismicAlerts(message.data)
      break
    default:
      console.warn('[WS] Type de message inconnu:', message.type)
  }
}
```

---

## 3.6 — Intégration Scheduler au Startup

```python
# backend/main.py — complet avec scheduler
from scheduler import HeliosScheduler
from websocket import manager

helios_scheduler = None

@app.on_event("startup")
async def startup():
    logger.info("HELIOS backend starting...")
    init_db()

    global helios_scheduler
    helios_scheduler = HeliosScheduler(ws_manager=manager, db_session_factory=get_session)
    helios_scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    if helios_scheduler:
        helios_scheduler.scheduler.shutdown()
```

> ✅ Backend temps réel fonctionnel → Passer à [ETAPE_4_COUCHES_DATA.md](./ETAPE_4_COUCHES_DATA.md)
