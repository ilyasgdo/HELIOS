# 📡 ÉTAPE 4 — Intégration des 10 Couches de Données

> **Objectif** : Brancher toutes les APIs externes et afficher les 10 couches de données sur le globe. Chaque couche doit s'activer/désactiver indépendamment.

**Durée estimée** : 4-5 jours  
**Dépendances** : [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md) complétée  
**Suivant** : [ETAPE_5_CCTV.md](./ETAPE_5_CCTV.md)

---

## ✅ Checklist de Validation

- [ ] ✈️ Avions OpenSky : points animés sur le globe, mis à jour toutes les 30s
- [ ] 🔴 Zones conflit : polygones rouges semi-transparents
- [ ] 🛰️ NASA GIBS : tuiles satellite en overlay
- [ ] 🚗 Trafic : heatmap colorée sur les routes
- [ ] 💹 Marchés : pays colorés selon performance boursière
- [ ] 📰 Hotspots news : marqueurs pulsants géolocalisés
- [ ] 🌡️ Macroéco : overlay indicateurs par pays (clic → détail)
- [ ] 🛸 Satellites orbitaux : positions TLE animées
- [ ] ⚡ Séismes USGS : marqueurs magnitude colorés
- [ ] Toutes les APIs échouent gracieusement (pas de crash si API down)

---

## 4.1 — ✈️ Aviation (OpenSky Network)

```python
# backend/routes/aviation.py
import httpx
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

OPENSKY_URL = "https://opensky-network.org/api/states/all"

async def fetch_planes(bounds: dict = None) -> list:
    """Fetche les avions depuis OpenSky (gratuit, no auth requis)."""
    params = {}
    if bounds:
        params = {
            'lamin': bounds['south'], 'lamax': bounds['north'],
            'lomin': bounds['west'], 'lomax': bounds['east']
        }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(OPENSKY_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            states = data.get('states', [])

            # Normaliser les données
            planes = []
            for state in states:
                if state[5] is None or state[6] is None:  # Skip si pas de position
                    continue
                planes.append({
                    'icao24': state[0],
                    'callsign': (state[1] or '').strip(),
                    'origin_country': state[2],
                    'longitude': state[5],
                    'latitude': state[6],
                    'altitude': state[7],
                    'velocity': state[9],
                    'heading': state[10],
                    'on_ground': state[8],
                })
            return planes
        except Exception as e:
            logger.error(f"OpenSky fetch error: {e}")
            return []

@router.get("/")
async def get_aviation():
    return await fetch_planes()
```

```javascript
// frontend/src/components/Globe/layers/AviationLayer.js
import { BillboardCollection, Color, VerticalOrigin } from 'cesium'

export class AviationLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.billboards = viewer.scene.primitives.add(new BillboardCollection())
  }

  update(planes) {
    this.billboards.removeAll()
    planes.forEach(plane => {
      if (plane.on_ground) return
      this.billboards.add({
        position: Cesium.Cartesian3.fromDegrees(plane.longitude, plane.latitude, plane.altitude || 10000),
        image: '/icons/plane.svg',
        scale: 0.5,
        color: Color.CYAN,
        verticalOrigin: VerticalOrigin.BOTTOM,
        rotation: Cesium.Math.toRadians(plane.heading || 0),
      })
    })
  }

  destroy() {
    this.viewer.scene.primitives.remove(this.billboards)
  }
}
```

---

## 4.2 — 📰 News Hotspots (NewsData.io)

```python
# backend/routes/news.py
import httpx
import logging
import os
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

NEWSDATA_URL = "https://newsdata.io/api/1/news"
API_KEY = os.getenv("NEWSDATA_API_KEY")

async def fetch_latest_news() -> list:
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(NEWSDATA_URL, params={
                "apikey": API_KEY,
                "language": "en,fr",
                "category": "world,politics,business",
                "size": 20,
            })
            resp.raise_for_status()
            articles = resp.json().get("results", [])

            # Filtrer ceux avec géolocalisation
            return [
                {
                    "title": a["title"],
                    "source": a["source_id"],
                    "country": a.get("country", [None])[0],
                    "pubDate": a["pubDate"],
                    "link": a["link"],
                    "description": a.get("description", ""),
                }
                for a in articles if a.get("country")
            ]
        except Exception as e:
            logger.error(f"NewsData fetch error: {e}")
            return []

@router.get("/latest")
async def get_news():
    return await fetch_latest_news()
```

---

## 4.3 — 💹 Marchés Financiers (Finnhub)

```python
# backend/routes/finance.py
import httpx
import logging
import os
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

FINNHUB_BASE = "https://finnhub.io/api/v1"
API_KEY = os.getenv("FINNHUB_API_KEY")

# Indices majeurs par pays
MAJOR_INDICES = {
    "US": "^GSPC",      # S&P 500
    "DE": "^GDAXI",     # DAX
    "FR": "^FCHI",      # CAC 40
    "JP": "^N225",      # Nikkei
    "GB": "^FTSE",      # FTSE 100
    "CN": "000001.SS",  # Shanghai
}

async def fetch_global_markets() -> list:
    results = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for country, symbol in MAJOR_INDICES.items():
            try:
                resp = await client.get(f"{FINNHUB_BASE}/quote", params={
                    "symbol": symbol,
                    "token": API_KEY
                })
                data = resp.json()
                change_pct = ((data["c"] - data["pc"]) / data["pc"] * 100) if data.get("pc") else 0
                results.append({
                    "country": country,
                    "symbol": symbol,
                    "price": data.get("c"),
                    "change_pct": round(change_pct, 2),
                    "trend": "up" if change_pct > 0 else "down",
                })
            except Exception as e:
                logger.error(f"Finance fetch {symbol}: {e}")
    return results

@router.get("/markets")
async def get_markets():
    return await fetch_global_markets()
```

---

## 4.4 — ⚡ Séismes USGS

```python
# backend/routes/weather.py
import httpx
import logging
from fastapi import APIRouter
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

async def fetch_earthquakes(min_magnitude: float = 4.0) -> list:
    """Séismes des dernières 24h, magnitude > 4.0."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(USGS_URL, params={
                "format": "geojson",
                "starttime": start_time.isoformat(),
                "endtime": end_time.isoformat(),
                "minmagnitude": min_magnitude,
                "orderby": "magnitude",
                "limit": 100,
            })
            features = resp.json().get("features", [])
            return [
                {
                    "id": f["id"],
                    "magnitude": f["properties"]["mag"],
                    "place": f["properties"]["place"],
                    "time": f["properties"]["time"],
                    "longitude": f["geometry"]["coordinates"][0],
                    "latitude": f["geometry"]["coordinates"][1],
                    "depth": f["geometry"]["coordinates"][2],
                    "url": f["properties"]["url"],
                }
                for f in features
            ]
        except Exception as e:
            logger.error(f"USGS fetch error: {e}")
            return []

@router.get("/earthquakes")
async def get_earthquakes():
    return await fetch_earthquakes()
```

---

## 4.5 — 🛸 Satellites Orbitaux (TLE)

```python
# backend/routes/orbital.py (bonus si temps)
import httpx
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

# CelesTrak — TLE gratuits
CELESTRAK_URL = "https://celestrak.org/SOCRATES/query.php"
ISS_TLE_URL = "https://celestrak.org/satcat/tle.php?CATNR=25544"

@router.get("/iss")
async def get_iss_position():
    """Position en temps réel de l'ISS."""
    async with httpx.AsyncClient() as client:
        try:
            # Utilise l'API Where The ISS At
            resp = await client.get("https://api.wheretheiss.at/v1/satellites/25544")
            data = resp.json()
            return {
                "name": "ISS",
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "altitude": data["altitude"],
                "velocity": data["velocity"],
            }
        except Exception as e:
            logger.error(f"ISS fetch error: {e}")
            return {}
```

---

## 4.6 — Color Mapping Finance sur le Globe

```javascript
// frontend/src/components/Globe/layers/FinanceLayer.js
// Colore les pays selon la performance boursière

const PERFORMANCE_COLORS = {
  strong_up: '#00ff88',   // +2% et plus
  up: '#44aa66',          // 0% à +2%
  neutral: '#666666',     // 0%
  down: '#aa4444',        // -2% à 0%
  strong_down: '#ff4444', // -2% et moins
}

export function getPerformanceColor(changePct) {
  if (changePct >= 2) return PERFORMANCE_COLORS.strong_up
  if (changePct > 0) return PERFORMANCE_COLORS.up
  if (changePct === 0) return PERFORMANCE_COLORS.neutral
  if (changePct > -2) return PERFORMANCE_COLORS.down
  return PERFORMANCE_COLORS.strong_down
}
```

> ✅ 10 couches de données actives → Passer à [ETAPE_5_CCTV.md](./ETAPE_5_CCTV.md)
