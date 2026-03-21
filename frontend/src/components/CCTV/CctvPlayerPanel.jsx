import { usePanelStore } from '../../stores/panelStore'
import styles from './CctvPlayerPanel.module.css'

export default function CctvPlayerPanel() {
  const { activePanel, selectedCctv, closePanel } = usePanelStore()

  if (activePanel !== 'cctvPlayer' || !selectedCctv) return null

  // Construction de l'URL du flux webcam.
  // Shodan remonte des IP:Port HTTP la plupart du temps (ex: webcams non sécurisées IP Camera, WebCamXP)
  const streamUrl = `http://${selectedCctv.ip}:${selectedCctv.port}`

  return (
    <div className={styles.panel} role="dialog" aria-label="Lecteur CCTV Live">
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <span className={styles.icon}>🎥</span>
          <div>
            <h2 className={styles.title}>CCTV Live Feed</h2>
            <p className={styles.subtitle}>{selectedCctv.city}, {selectedCctv.country}</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={closePanel} aria-label="Fermer CCTV">✕</button>
      </div>

      <div className={styles.content}>
        <div className={styles.playerWrapper}>
          <iframe 
            src={streamUrl} 
            title={`CCTV ${selectedCctv.ip}`}
            className={styles.iframe}
            sandbox="allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
          />
          <div className={styles.liveOverlay}>
            <span className={styles.dot}></span> EN DIRECT
          </div>
        </div>
        
        <div className={styles.metaData}>
          <div className={styles.metaRow}>
            <span>Adresse:</span>
            <span className={styles.metaValue}>{selectedCctv.ip}:{selectedCctv.port}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Organisation:</span>
            <span className={styles.metaValue}>{selectedCctv.org || 'Unknown'}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Coordonnées:</span>
            <span className={styles.metaValue}>{selectedCctv.latitude?.toFixed(4)}, {selectedCctv.longitude?.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
