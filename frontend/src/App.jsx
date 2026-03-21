import { useState } from 'react'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import Globe from './components/Globe/Globe'
import Header from './components/Header/Header'
import PanelContainer from './components/Panels/PanelContainer'
import AlertBanner from './components/Alerts/AlertBanner'
import AlertsPanel from './components/Alerts/AlertsPanel'
import CctvPlayerPanel from './components/CCTV/CctvPlayerPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { useGlobeData } from './hooks/useGlobeData'
import { usePanelStore } from './stores/panelStore'
import styles from './App.module.css'

function AppContent() {
  const [loaded, setLoaded] = useState(false)
  const { activePanel, closePanel } = usePanelStore()

  // Connexion WebSocket (données temps réel)
  useWebSocket()

  // Chargement initial des données REST
  useGlobeData()

  return (
    <div className={styles.app}>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {/* Globe 3D en fond (toujours rendu pour init Cesium) */}
      <Globe />

      {/* UI superposée - visible après loading screen */}
      {loaded && (
        <>
          <Header />
          <AlertBanner />
          <AlertsPanel />
          <CctvPlayerPanel />

          {/* Panel classique (News, Finance) */}
          {activePanel && !['cctv', 'alerts'].includes(activePanel) && <PanelContainer />}
        </>
      )}
    </div>
  )
}

export default AppContent
