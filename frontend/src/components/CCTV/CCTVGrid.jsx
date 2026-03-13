import { useState, useEffect, useCallback } from 'react'
import CCTVPlayer from './CCTVPlayer'
import styles from './CCTVGrid.module.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const MAX_STREAMS = 4

export default function CCTVGrid({ onClose }) {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeStreams, setActiveStreams] = useState([]) // caméras ouvertes (max 4)
  const [selected, setSelected] = useState(null) // caméra survolée/sélectionnée

  // Charger la liste des caméras
  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/cctv/cameras?limit=200`)
      .then((r) => r.json())
      .then((data) => {
        setCameras(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const openStream = useCallback((cam) => {
    setActiveStreams((prev) => {
      if (prev.find((c) => c.id === cam.id)) return prev
      const updated = [...prev, cam]
      return updated.slice(-MAX_STREAMS) // garder max 4
    })
  }, [])

  const closeStream = useCallback((camId) => {
    setActiveStreams((prev) => prev.filter((c) => c.id !== camId))
  }, [])

  const filtered = cameras.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.state || '').toLowerCase().includes(search.toLowerCase()),
  )

  // Colonnes selon le nombre de streams actifs
  const gridCols = activeStreams.length <= 1 ? 1 : 2

  return (
    <div className={styles.panel}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span>📷</span>
          <span>CCTV — Flux en Direct</span>
          {activeStreams.length > 0 && (
            <span className={styles.streamCount}>{activeStreams.length}/{MAX_STREAMS}</span>
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      {/* Grille des streams actifs */}
      {activeStreams.length > 0 && (
        <div
          className={styles.streamGrid}
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {activeStreams.map((cam) => (
            <CCTVPlayer
              key={cam.id}
              camera={cam}
              onClose={() => closeStream(cam.id)}
            />
          ))}
        </div>
      )}

      {/* Barre de recherche */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="🔍 Rechercher une ville, un lieu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une caméra"
        />
        <span className={styles.searchCount}>
          {filtered.length} cam{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste des caméras */}
      <div className={styles.cameraList}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Chargement des caméras...</span>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            Aucune caméra trouvée
          </div>
        )}
        {!loading &&
          filtered.map((cam) => {
            const isActive = activeStreams.some((c) => c.id === cam.id)
            return (
              <button
                key={cam.id}
                className={`${styles.camItem} ${isActive ? styles.active : ''}`}
                onClick={() => openStream(cam)}
                aria-label={`Ouvrir le stream ${cam.name}`}
                aria-pressed={isActive}
              >
                <span className={styles.camIcon}>
                  {cam.type === 'landmark' ? '🏙️' : '🚦'}
                </span>
                <div className={styles.camInfo}>
                  <span className={styles.camName}>{cam.name}</span>
                  {cam.city && (
                    <span className={styles.camCity}>
                      {cam.city}{cam.state ? `, ${cam.state}` : ''}
                    </span>
                  )}
                </div>
                {isActive && <span className={styles.activeDot} />}
              </button>
            )
          })}
      </div>
    </div>
  )
}
