import { useGlobeStore } from '../../stores/globeStore'
import styles from './FinancePanel.module.css'

const FLAGS = {
  US: '🇺🇸', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵',
  GB: '🇬🇧', CN: '🇨🇳', IN: '🇮🇳', BR: '🇧🇷',
}

export default function FinancePanel() {
  const { financeData } = useGlobeStore()

  if (!financeData || financeData.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📡</span>
        <p>Connexion aux marchés globaux...</p>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        {financeData.map((market) => {
          const isUp = market.change_pct >= 0
          return (
            <li key={market.country} className={styles.row}>
              <span className={styles.flag}>
                {FLAGS[market.country] || '🌍'}
              </span>
              <div className={styles.info}>
                <span className={styles.symbol}>{market.symbol}</span>
                <span className={styles.country}>{market.country}</span>
              </div>
              <div className={styles.priceWrap}>
                <span className={styles.price}>
                  {market.price?.toLocaleString('fr-FR')}
                </span>
                <span
                  className={styles.change}
                  style={{ color: isUp ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {isUp ? '▲' : '▼'} {Math.abs(market.change_pct).toFixed(2)}%
                </span>
              </div>
              {/* Mini bar de performance */}
              <div
                className={styles.bar}
                style={{
                  background: isUp
                    ? 'var(--color-success-glow)'
                    : 'var(--color-danger-glow)',
                  borderLeftColor: isUp
                    ? 'var(--color-success)'
                    : 'var(--color-danger)',
                }}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
