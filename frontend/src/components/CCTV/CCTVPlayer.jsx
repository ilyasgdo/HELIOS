import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import styles from './CCTVPlayer.module.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function CCTVPlayer({ camera, onClose }) {
  const videoRef = useRef(null)
  const hlsRef   = useRef(null)
  const [status, setStatus] = useState('connecting') // 'connecting' | 'live' | 'error'

  const setupStream = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const src = `${API_BASE}/api/cctv/stream/${camera.id}`
    setStatus('connecting')

    // Nettoyer l'instance HLS précédente
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('live')
        video.play().catch(() => setStatus('error'))
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setStatus('error')
      })
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.oncanplay = () => {
        setStatus('live')
        video.play().catch(() => setStatus('error'))
      }
      video.onerror = () => setStatus('error')
    } else {
      setStatus('error')
    }
  }, [camera.id])

  useEffect(() => {
    setupStream()
    return () => {
      hlsRef.current?.destroy()
    }
  }, [setupStream])

  return (
    <div className={styles.player}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.info}>
          <span className={styles.name}>{camera.name}</span>
          {camera.city && (
            <span className={styles.location}>
              {camera.city}{camera.state ? `, ${camera.state}` : ''}
            </span>
          )}
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Fermer le stream"
        >
          ✕
        </button>
      </div>

      {/* Vidéo */}
      <div className={styles.videoWrap}>
        <video
          ref={videoRef}
          className={styles.video}
          muted
          playsInline
          autoPlay
        />

        {/* Status overlay */}
        {status !== 'live' && (
          <div className={styles.overlay}>
            {status === 'connecting' && (
              <>
                <div className={styles.spinner} />
                <span>Connexion...</span>
              </>
            )}
            {status === 'error' && (
              <>
                <span className={styles.errorIcon}>⚠️</span>
                <span>Stream indisponible</span>
                <button className={styles.retryBtn} onClick={setupStream}>
                  Réessayer
                </button>
              </>
            )}
          </div>
        )}

        {/* Badge LIVE */}
        {status === 'live' && (
          <div className={styles.liveBadge} aria-label="En direct">
            <span className={styles.liveDot} />
            LIVE
          </div>
        )}
      </div>
    </div>
  )
}
