import { useGlobeStore } from '../../stores/globeStore'
import styles from './NewsPanel.module.css'

const COUNTRY_FLAGS = {
  us: '🇺🇸', fr: '🇫🇷', gb: '🇬🇧', de: '🇩🇪', cn: '🇨🇳',
  ru: '🇷🇺', jp: '🇯🇵', in: '🇮🇳', br: '🇧🇷', au: '🇦🇺',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Il y a quelques secondes'
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  return `Il y a ${hrs}h`
}

export default function NewsPanel() {
  const { newsData } = useGlobeStore()

  if (newsData.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📡</span>
        <p>Connexion aux flux d'actualités...</p>
        <p className={styles.emptyHint}>Backend requis pour recevoir les données</p>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {newsData.slice(0, 20).map((article, i) => {
        const flag = COUNTRY_FLAGS[article.country?.toLowerCase()] || '🌍'
        return (
          <li key={i} className={styles.item}>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label={`${article.title} — ${article.source}`}
            >
              <div className={styles.meta}>
                <span className={styles.flag}>{flag}</span>
                <span className={styles.source}>{article.source}</span>
                <span className={styles.time}>{timeAgo(article.pubDate)}</span>
              </div>
              <p className={styles.headline}>{article.title}</p>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
