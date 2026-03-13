/**
 * NewsHotspotsLayer — Affiche des marqueurs pulsants sur le globe
 * aux endroits des actualités mondiales géolocalisées.
 */

// Map pays → coordonnées centroïdes
const COUNTRY_COORDS = {
  us: [-98.5795, 39.8283],
  gb: [-3.4360, 55.3781],
  fr: [2.3488, 48.8534],
  de: [10.4515, 51.1657],
  ru: [105.3188, 61.5240],
  cn: [104.1954, 35.8617],
  jp: [138.2529, 36.2048],
  in: [78.9629, 20.5937],
  br: [-51.9253, -14.2350],
  au: [133.7751, -25.2744],
  ca: [-96.8147, 56.1304],
  za: [22.9375, -30.5595],
  eg: [30.8025, 26.8206],
  ng: [8.6753, 9.0820],
  mx: [-102.5528, 23.6345],
  sa: [45.0792, 23.8859],
  tr: [35.2433, 38.9637],
  ir: [53.6880, 32.4279],
  il: [34.8516, 31.0461],
  ua: [31.1656, 48.3794],
  sy: [38.9968, 34.8021],
  ye: [48.5164, 15.5527],
  so: [46.1996, 5.1521],
  sd: [30.2176, 12.8628],
  af: [67.7100, 33.9391],
  pk: [69.3451, 30.3753],
  kp: [127.5101, 40.3399],
  id: [113.9213, -0.7893],
  vn: [108.2772, 14.0583],
  mm: [95.9560, 21.9162],
}

const PULSE_COLORS = [
  '#4488ff', '#00aaff', '#0066cc', '#88aaff',
]

export class NewsHotspotsLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.entities = viewer.entities
    this._ids = []
    this._visible = false
  }

  update(newsArticles) {
    if (!this._visible) return
    this._clear()
    const Cesium = window.Cesium

    // Grouper les articles par pays
    const byCountry = {}
    newsArticles.forEach((article) => {
      const code = article.country?.toLowerCase()
      if (!code || !COUNTRY_COORDS[code]) return
      if (!byCountry[code]) byCountry[code] = []
      byCountry[code].push(article)
    })

    Object.entries(byCountry).forEach(([code, articles], idx) => {
      const [lon, lat] = COUNTRY_COORDS[code]
      const color = Cesium.Color.fromCssColorString(
        PULSE_COLORS[idx % PULSE_COLORS.length],
      )

      const entity = this.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 50000),
        point: {
          pixelSize: 10 + Math.min(articles.length * 2, 16),
          color: color.withAlpha(0.9),
          outlineColor: color.withAlpha(0.3),
          outlineWidth: 8 + articles.length * 2,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 8e6, 0.4),
        },
        label: {
          text: `${articles.length} article${articles.length > 1 ? 's' : ''}`,
          font: '11px JetBrains Mono, monospace',
          fillColor: Cesium.Color.WHITE.withAlpha(0.8),
          outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.0, 5e6, 0.0),
        },
        description: articles.map((a) => `<b>${a.source}</b>: ${a.title}`).join('<br/>'),
      })
      this._ids.push(entity.id)
    })
  }

  _clear() {
    this._ids.forEach((id) => {
      const entity = this.entities.getById(id)
      if (entity) this.entities.remove(entity)
    })
    this._ids = []
  }

  setVisible(visible) {
    this._visible = visible
    if (!visible) this._clear()
  }

  destroy() {
    this._clear()
  }
}
