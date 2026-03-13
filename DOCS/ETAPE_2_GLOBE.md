# 🌍 ÉTAPE 2 — Globe 3D CesiumJS

> **Objectif** : Afficher un globe 3D interactif avec les couches de base (fond de carte satellite NASA, terrain 3D) et le système de layers modulaire prêt à recevoir les données.

**Durée estimée** : 2-3 jours  
**Dépendances** : [ETAPE_1_SETUP.md](./ETAPE_1_SETUP.md) complétée  
**Suivant** : [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md)

---

## ✅ Checklist de Validation

- [ ] Globe 3D s'affiche en plein écran (fond noir + Terre)
- [ ] La navigation fonctionne (zoom, rotation, clic)
- [ ] Les tuiles satellite NASA GIBS sont chargées
- [ ] Le terrain 3D Cesium Ion est actif (montagnes en relief)
- [ ] Le système de toggle des couches fonctionne (ON/OFF)
- [ ] Les perf sont acceptables (>30 FPS sur machine standard)
- [ ] Aucun token Cesium dans le code source

---

## 2.1 — Configuration CesiumJS dans Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: '/' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: '/' },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: '/' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: '/' },
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/'),
  }
})
```

---

## 2.2 — Composant Globe Principal

```jsx
// frontend/src/components/Globe/Globe.jsx
import { useEffect, useRef } from 'react'
import { Ion, Viewer, ImageryLayer, WebMapTileServiceImageryProvider } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { useGlobeStore } from '../../stores/globeStore'
import styles from './Globe.module.css'

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_TOKEN

export default function Globe() {
  const viewerRef = useRef(null)
  const cesiumContainer = useRef(null)
  const { activeLayers } = useGlobeStore()

  useEffect(() => {
    Ion.defaultAccessToken = CESIUM_TOKEN

    const viewer = new Viewer(cesiumContainer.current, {
      terrainProvider: undefined, // Sera ajouté après
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
    })

    // Fond sombre (pas de texture par défaut)
    viewer.scene.backgroundColor = Color.BLACK

    // Terrain 3D Cesium Ion
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync()

    viewerRef.current = viewer
    return () => viewer.destroy()
  }, [])

  return (
    <div
      id="cesiumContainer"
      ref={cesiumContainer}
      className={styles.globe}
    />
  )
}
```

```css
/* Globe.module.css */
.globe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}
```

---

## 2.3 — Couche Satellite NASA GIBS

```javascript
// frontend/src/components/Globe/layers/NASASatelliteLayer.js
import { WebMapTileServiceImageryProvider, ImageryLayer } from 'cesium'

export function createNASASatelliteLayer() {
  const provider = new WebMapTileServiceImageryProvider({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
    layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: '250m',
    maximumLevel: 8,
    credit: 'NASA GIBS',
  })

  return new ImageryLayer(provider, { alpha: 1.0 })
}
```

---

## 2.4 — Système de Couches Modulaire

```javascript
// frontend/src/stores/globeStore.js
import { create } from 'zustand'

export const useGlobeStore = create((set) => ({
  viewer: null,
  activeLayers: {
    satellite: true,     // NASA GIBS
    aviation: false,     // OpenSky avions
    conflicts: false,    // Zones de conflit GeoJSON
    traffic: false,      // Heatmap trafic routier
    finance: false,      // Couleur pays par marché
    news: false,         // Hotspots news
    macro: false,        // Indicateurs économiques
    orbital: false,      // Satellites orbitaux
    cctv: false,         // Points CCTV
    seismic: false,      // Alertes sismiques
  },

  setViewer: (viewer) => set({ viewer }),

  toggleLayer: (layerName) => set((state) => ({
    activeLayers: {
      ...state.activeLayers,
      [layerName]: !state.activeLayers[layerName],
    }
  })),

  setLayerActive: (layerName, active) => set((state) => ({
    activeLayers: { ...state.activeLayers, [layerName]: active }
  })),
}))
```

---

## 2.5 — Toolbar de Contrôle des Couches

```jsx
// frontend/src/components/Globe/LayerToolbar.jsx
import { useGlobeStore } from '../../stores/globeStore'
import styles from './LayerToolbar.module.css'

const LAYERS = [
  { key: 'satellite', icon: '🛰️', label: 'Satellite' },
  { key: 'aviation', icon: '✈️', label: 'Aviation' },
  { key: 'conflicts', icon: '🔴', label: 'Conflits' },
  { key: 'traffic', icon: '🚗', label: 'Trafic' },
  { key: 'finance', icon: '💹', label: 'Marchés' },
  { key: 'news', icon: '📰', label: 'News' },
  { key: 'macro', icon: '🌡️', label: 'Macro' },
  { key: 'orbital', icon: '🛸', label: 'Orbites' },
  { key: 'cctv', icon: '📷', label: 'CCTV' },
  { key: 'seismic', icon: '⚡', label: 'Alertes' },
]

export default function LayerToolbar() {
  const { activeLayers, toggleLayer } = useGlobeStore()

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Couches Globe">
      {LAYERS.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`${styles.btn} ${activeLayers[key] ? styles.active : ''}`}
          onClick={() => toggleLayer(key)}
          aria-label={`Toggle ${label}`}
          aria-pressed={activeLayers[key]}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  )
}
```

---

## 2.6 — Zones de Conflit GeoJSON (statique pour commencer)

```javascript
// frontend/src/components/Globe/layers/ConflictZonesLayer.js
import { GeoJsonDataSource, Color } from 'cesium'

const CONFLICT_ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Ukraine', intensity: 'high' },
      geometry: {
        type: 'Polygon',
        coordinates: [[ [22, 48], [40, 48], [40, 52], [22, 52], [22, 48] ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Gaza', intensity: 'high' },
      geometry: {
        type: 'Polygon',
        coordinates: [[ [34.2, 31.2], [34.6, 31.2], [34.6, 31.6], [34.2, 31.6], [34.2, 31.2] ]]
      }
    },
    // Ajouter d'autres zones...
  ]
}

export async function addConflictZonesLayer(viewer) {
  const dataSource = await GeoJsonDataSource.load(CONFLICT_ZONES, {
    fill: Color.RED.withAlpha(0.3),
    stroke: Color.RED,
    strokeWidth: 2,
  })
  viewer.dataSources.add(dataSource)
  return dataSource
}
```

---

## 2.7 — Intégration dans App.jsx

```jsx
// frontend/src/App.jsx
import Globe from './components/Globe/Globe'
import LayerToolbar from './components/Globe/LayerToolbar'
import SearchBar from './components/Search/SearchBar'
import styles from './App.module.css'

export default function App() {
  return (
    <main className={styles.app}>
      {/* Layer 0: Globe 3D (fond) */}
      <Globe />

      {/* Layer 1: UI superposée */}
      <div className={styles.overlay}>
        <SearchBar />
        <LayerToolbar />
      </div>
    </main>
  )
}
```

---

## 🔗 Ressources

- [CesiumJS Docs](https://cesium.com/learn/cesiumjs/ref-doc/)
- [NASA GIBS Layer Catalog](https://nasa.github.io/gibs/docs/available-visualizations/)
- [CesiumJS + Vite Setup](https://cesium.com/learn/cesiumjs-learn/cesiumjs-vite/)

> ✅ Globe fonctionnel → Passer à [ETAPE_3_BACKEND_API.md](./ETAPE_3_BACKEND_API.md)
