import { useEffect, useRef } from 'react'
import * as CesiumLib from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { useGlobeStore } from '../../stores/globeStore'
import LayerToolbar from './LayerToolbar'
import { AviationLayer } from './layers/AviationLayer'
import { ConflictZonesLayer } from './layers/ConflictZonesLayer'
import { SeismicLayer } from './layers/SeismicLayer'
import { NewsHotspotsLayer } from './layers/NewsHotspotsLayer'
import { FinanceLayer } from './layers/FinanceLayer'
import { CctvLayer } from './layers/CctvLayer'
import styles from './Globe.module.css'

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_TOKEN

export default function Globe() {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const layersRef = useRef({})

  const {
    setViewer,
    activeLayers,
    aviationData,
    newsData,
    financeData,
    seismicData,
    cctvData,
  } = useGlobeStore()

  // ── Init CesiumJS ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    // ⚠️ CRITIQUE : exposer Cesium globalement AVANT de créer les couches
    window.Cesium = CesiumLib

    CesiumLib.Ion.defaultAccessToken = CESIUM_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

    const creditDiv = document.createElement('div')

    let viewer
    try {
      viewer = new CesiumLib.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: true,
        selectionIndicator: false,
        creditContainer: creditDiv,
      })
    } catch (err) {
      console.error('[Globe] Viewer init failed:', err)
      return
    }

    // Apparence de la scène
    viewer.scene.backgroundColor = CesiumLib.Color.BLACK
    viewer.scene.skyBox.show = false
    viewer.scene.sun.show = true
    viewer.scene.moon.show = false

    // Texture dark CartoDB DarkMatter (gratuit, esthétique spatial)
    try {
      viewer.imageryLayers.removeAll()

      // CartoDB DarkMatter — 4 serveurs de tuiles disponibles
      const cartdDbProvider = new CesiumLib.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        credit: '© OpenStreetMap contributors © CARTO',
        maximumLevel: 18,
      })
      viewer.imageryLayers.addImageryProvider(cartdDbProvider)
    } catch (err) {
      // Fallback OpenStreetMap si CartoDB indisponible
      try {
        const osmFallback = new CesiumLib.UrlTemplateImageryProvider({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          credit: '© OpenStreetMap contributors',
          maximumLevel: 19,
        })
        viewer.imageryLayers.addImageryProvider(osmFallback)
      } catch { /* ignore */ }
      console.warn('[Globe] CartoDB layer failed, using OSM fallback:', err)
    }

    // Terrain 3D — optionnel (nécessite token Cesium Ion valide)
    CesiumLib.createWorldTerrainAsync()
      .then((t) => { if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = t })
      .catch(() => { /* pas de terrain sans token valide */ })

    // ── Créer les couches (toutes dans un try/catch global) ──
    try {
      layersRef.current = {
        aviation:  new AviationLayer(viewer),
        conflicts: new ConflictZonesLayer(viewer),
        seismic:   new SeismicLayer(viewer),
        news:      new NewsHotspotsLayer(viewer),
        finance:   new FinanceLayer(viewer),
        cctv:      new CctvLayer(viewer),
      }
    } catch (err) {
      console.error('[Globe] Layers init failed:', err)
    }

    // ── Gérer les clics sur les entités du globe ──
    const handler = new CesiumLib.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position)
      if (CesiumLib.defined(picked) && picked.id) {
        const entity = picked.id
        if (entity.properties && entity.properties.type) {
          const type = entity.properties.type.getValue()
          if (type === 'cctv') {
             const camData = entity.properties.camData.getValue()
             // Appel Zustand Store via getState() car nous sommes dans un useEffect natif DOM
             import('../../stores/panelStore').then(module => {
               module.usePanelStore.getState().openCctvPlayer(camData)
             })
          }
        }
      }
    }, CesiumLib.ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer
    setViewer(viewer)

    return () => {
      handler.destroy()
      Object.values(layersRef.current).forEach((layer) => {
        try { layer.destroy() } catch { /* ignore */ }
      })
      layersRef.current = {}
      try { viewer.destroy() } catch { /* ignore */ }
    }
  }, [setViewer])

  // ── Toggle visibilité des couches ─────────────────────────────
  useEffect(() => {
    const { aviation, conflicts, seismic, news, finance, cctv } = layersRef.current
    aviation?.setVisible(activeLayers.aviation)
    conflicts?.setVisible(activeLayers.conflicts)
    seismic?.setVisible(activeLayers.seismic)
    news?.setVisible(activeLayers.news)
    finance?.setVisible(activeLayers.finance)
    cctv?.setVisible(activeLayers.cctv)
  }, [activeLayers])

  // ── Mise à jour données → couches ─────────────────────────────
  useEffect(() => {
    if (activeLayers.aviation && aviationData.length > 0)
      layersRef.current.aviation?.update(aviationData)
  }, [aviationData, activeLayers.aviation])

  useEffect(() => {
    if (activeLayers.seismic && seismicData.length > 0)
      layersRef.current.seismic?.update(seismicData)
  }, [seismicData, activeLayers.seismic])

  useEffect(() => {
    if (activeLayers.news && newsData.length > 0)
      layersRef.current.news?.update(newsData)
  }, [newsData, activeLayers.news])

  useEffect(() => {
    if (activeLayers.finance && financeData.length > 0)
      layersRef.current.finance?.update(financeData)
  }, [financeData, activeLayers.finance])

  useEffect(() => {
    if (activeLayers.cctv && cctvData && cctvData.length > 0)
      layersRef.current.cctv?.update(cctvData)
  }, [cctvData, activeLayers.cctv])

  return (
    <>
      <div
        ref={containerRef}
        id="cesiumContainer"
        className={styles.globe}
        aria-label="Globe 3D interactif HELIOS"
      />
      <LayerToolbar />
    </>
  )
}
