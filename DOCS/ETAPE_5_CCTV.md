# 📹 ÉTAPE 5 — Module CCTV Live Streams

> **Objectif** : Afficher des points CCTV cliquables sur le globe, et un grid de streams vidéo live (jusqu'à 4 simultanés) depuis des caméras publiques.

**Durée estimée** : 2-3 jours  
**Dépendances** : [ETAPE_2_GLOBE.md](./ETAPE_2_GLOBE.md) + [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md)  
**Suivant** : [ETAPE_6_ALERTES.md](./ETAPE_6_ALERTES.md)

---

## ✅ Checklist de Validation

- [ ] Points CCTV visibles sur le globe (icône caméra)
- [ ] Clic sur un point ouvre le stream dans le panel
- [ ] Grid 2x2 peut afficher jusqu'à 4 streams simultanés
- [ ] Les streams HLS/MJPEG jouent sans erreur CORS
- [ ] Le backend proxy les streams (pas d'URL directe exposée)
- [ ] Une caméra hors ligne affiche un message d'erreur propre
- [ ] Fermeture d'un stream libère les ressources correctement

---

## 5.1 — Sources de Données CCTV

### Source Principale : OpenTrafficCamMap
```python
# backend/routes/cctv.py
import httpx
import json
import logging
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Dataset GitHub : liste de 7500+ caméras trafic USA avec coordonnées
CAMERAS_DATASET_URL = (
    "https://raw.githubusercontent.com/ubergesundheit/opendata-cams/master/cameras.geojson"
)

_cameras_cache = None

async def get_cameras_data() -> list:
    """Charge et cache la liste des caméras."""
    global _cameras_cache
    if _cameras_cache:
        return _cameras_cache

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(CAMERAS_DATASET_URL)
            features = resp.json().get("features", [])
            cameras = []
            for f in features:
                coords = f["geometry"]["coordinates"]
                props = f["properties"]
                stream_url = props.get("url", "") or props.get("streamUrl", "")
                if not stream_url:
                    continue
                cameras.append({
                    "id": f.get("id", hash(stream_url)),
                    "name": props.get("name", "CCTV"),
                    "city": props.get("city", ""),
                    "state": props.get("state", ""),
                    "longitude": coords[0],
                    "latitude": coords[1],
                    "stream_url": stream_url,
                    "type": "traffic",
                })
            _cameras_cache = cameras
            logger.info(f"Loaded {len(cameras)} CCTV cameras")
            return cameras
        except Exception as e:
            logger.error(f"CCTV load error: {e}")
            return []

@router.get("/cameras")
async def list_cameras(
    lat: float = None, lon: float = None,
    radius_km: float = 500, limit: int = 200
):
    """Liste les caméras, avec filtrage géographique optionnel."""
    cameras = await get_cameras_data()
    
    if lat is not None and lon is not None:
        import math
        def distance(c):
            dlat = math.radians(c['latitude'] - lat)
            dlon = math.radians(c['longitude'] - lon)
            a = (math.sin(dlat/2)**2 +
                 math.cos(math.radians(lat)) *
                 math.cos(math.radians(c['latitude'])) *
                 math.sin(dlon/2)**2)
            return 6371 * 2 * math.asin(math.sqrt(a))
        cameras = [c for c in cameras if distance(c) <= radius_km]
    
    return cameras[:limit]

@router.get("/stream/{camera_id}")
async def proxy_stream(camera_id: str):
    """
    Proxy le stream vidéo pour éviter les problèmes CORS.
    Le frontend ne connaît jamais l'URL directe.
    """
    cameras = await get_cameras_data()
    cam = next((c for c in cameras if str(c['id']) == camera_id), None)
    
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    stream_url = cam['stream_url']
    
    async def stream_generator():
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("GET", stream_url) as resp:
                async for chunk in resp.aiter_bytes(chunk_size=8192):
                    yield chunk
    
    return StreamingResponse(
        stream_generator(),
        media_type="application/x-mpegURL"  # HLS
    )
```

---

## 5.2 — Points CCTV sur le Globe

```javascript
// frontend/src/components/Globe/layers/CCTVPointsLayer.js
import { PointPrimitiveCollection, Color, NearFarScalar } from 'cesium'
import { useGlobeStore } from '../../../stores/globeStore'

export class CCTVPointsLayer {
  constructor(viewer, onCameraClick) {
    this.viewer = viewer
    this.onCameraClick = onCameraClick
    this.points = viewer.scene.primitives.add(new PointPrimitiveCollection())
    this.cameraData = []
    
    this._setupClickHandler()
  }

  async load() {
    try {
      const resp = await fetch('/api/cctv/cameras?limit=500')
      const cameras = await resp.json()
      this.cameraData = cameras
      this._render(cameras)
    } catch (e) {
      console.error('[CCTV] Load error:', e)
    }
  }

  _render(cameras) {
    this.points.removeAll()
    cameras.forEach((cam, idx) => {
      this.points.add({
        position: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude),
        color: Color.CYAN.withAlpha(0.8),
        pixelSize: 6,
        scaleByDistance: new NearFarScalar(1e4, 1.5, 1e6, 0.5),
        id: idx,
      })
    })
  }

  _setupClickHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    handler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position)
      if (picked && picked.primitive instanceof Cesium.PointPrimitive) {
        const cam = this.cameraData[picked.id]
        if (cam) this.onCameraClick(cam)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  destroy() {
    this.viewer.scene.primitives.remove(this.points)
  }
}
```

---

## 5.3 — Grid CCTV (4 Streams Simultanés)

```jsx
// frontend/src/components/CCTV/CCTVGrid.jsx
import { useState, useCallback } from 'react'
import CCTVPlayer from './CCTVPlayer'
import styles from './CCTVGrid.module.css'

const MAX_STREAMS = 4

export default function CCTVGrid({ cameras, onClose }) {
  const [activeStreams, setActiveStreams] = useState([])

  const addStream = useCallback((camera) => {
    setActiveStreams(prev => {
      if (prev.find(c => c.id === camera.id)) return prev
      if (prev.length >= MAX_STREAMS) {
        // Remplace le plus ancien
        return [...prev.slice(1), camera]
      }
      return [...prev, camera]
    })
  }, [])

  const removeStream = useCallback((cameraId) => {
    setActiveStreams(prev => prev.filter(c => c.id !== cameraId))
  }, [])

  return (
    <div className={styles.grid} data-count={activeStreams.length}>
      {activeStreams.map(cam => (
        <CCTVPlayer
          key={cam.id}
          camera={cam}
          onClose={() => removeStream(cam.id)}
        />
      ))}
      {activeStreams.length === 0 && (
        <div className={styles.empty}>
          <span>📷</span>
          <p>Cliquez sur un point CCTV sur le globe pour afficher un stream</p>
        </div>
      )}
    </div>
  )
}
```

```jsx
// frontend/src/components/CCTV/CCTVPlayer.jsx
import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import styles from './CCTVPlayer.module.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function CCTVPlayer({ camera, onClose }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const src = `${API_BASE}/api/cctv/stream/${camera.id}`

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play())
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play()
    }

    return () => {
      hlsRef.current?.destroy()
    }
  }, [camera.id])

  return (
    <div className={styles.player}>
      <div className={styles.header}>
        <span className={styles.name}>{camera.name}</span>
        <span className={styles.location}>{camera.city}, {camera.state}</span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Fermer le stream"
        >
          ✕
        </button>
      </div>
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        controls={false}
      />
      <div className={styles.liveBadge}>● LIVE</div>
    </div>
  )
}
```

---

## 5.4 — CSS Grid Dynamique

```css
/* CCTVGrid.module.css */
.grid {
  display: grid;
  gap: 4px;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
}

/* 1 stream : plein écran */
.grid[data-count="1"] {
  grid-template-columns: 1fr;
}

/* 2 streams : côte à côte */
.grid[data-count="2"] {
  grid-template-columns: 1fr 1fr;
}

/* 3-4 streams : 2x2 */
.grid[data-count="3"],
.grid[data-count="4"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.player {
  position: relative;
  background: #000;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.liveBadge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: rgba(255, 0, 0, 0.8);
  color: white;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 3px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

> ✅ CCTV streams fonctionnels → Passer à [ETAPE_6_ALERTES.md](./ETAPE_6_ALERTES.md)
