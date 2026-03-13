import { useEffect, useState, useCallback } from 'react'
import styles from './LoadingScreen.module.css'

const BOOT_MESSAGES = [
  'Initializing HELIOS terminal...',
  'Connecting to global data feeds...',
  'Loading CesiumJS globe engine...',
  'Establishing WebSocket channel...',
  'Fetching satellite imagery tiles...',
  'Calibrating intelligence modules...',
  'System online.',
]

export default function LoadingScreen({ onComplete }) {
  const [messages, setMessages] = useState([BOOT_MESSAGES[0]])
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  const finish = useCallback(() => {
    setFadeOut(true)
    setTimeout(onComplete, 600)
  }, [onComplete])

  useEffect(() => {
    let index = 1
    const total = BOOT_MESSAGES.length - 1

    const interval = setInterval(() => {
      if (index > total) {
        clearInterval(interval)
        setTimeout(finish, 400)
        return
      }
      setMessages((prev) => [...prev, BOOT_MESSAGES[index]])
      setProgress(Math.round((index / total) * 100))
      index++
    }, 380)

    return () => clearInterval(interval)
  }, [finish])

  return (
    <div className={`${styles.screen} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.logo}>⬡ HELIOS</div>
      <div className={styles.subtitle}>GLOBAL INTELLIGENCE TERMINAL</div>

      <div className={styles.terminal} aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={styles.line}>
            <span className={styles.prompt}>&gt;</span>
            <span className={styles.msg}>{msg}</span>
          </div>
        ))}
        <span className={styles.cursor}>█</span>
      </div>

      <div className={styles.progressWrap}>
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressText}>{progress}%</span>
      </div>
    </div>
  )
}
