import { useGlobeStore } from '../../stores/globeStore'
import styles from './FinancePanel.module.css'

const FLAGS = {
  US: '🇺🇸', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵',
  GB: '🇬🇧', CN: '🇨🇳', IN: '🇮🇳', BR: '🇧🇷',
}

const DEMO_DATA = [
  { country: 'US', symbol: 'S&P 500', price: 5123, change_pct: 0.82 },
  { country: 'DE', symbol: 'DAX', price: 18234, change_pct: -0.43 },
  { country: 'FR', symbol: 'CAC 40', price: 7891, change_pct: 0.15 },
  { country: 'JP', symbol: 'Nikkei', price: 38542, change_pct: 1.22 },
  { country: 'GB', symbol: 'FTSE 100', price: 7654, change_pct: -0.18 },
  { country: 'CN', symbol: 'Shanghai', price: 3012, change_pct: -1.34 },
]

export default function FinancePanel() {
  const { financeData } = useGlobeStore()
  const data = financeData.length > 0 ? financeData : DEMO_DATA
  const isDemo = financeData.length === 0

  return (
    <div className={styles.panel}>
      {isDemo && (
        <div className={styles.demoNote}>
          📡 Données de démo — Backend requis pour les données live
        </div>
      )}
      <ul className={styles.list}>
        {data.map((market) => {
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
