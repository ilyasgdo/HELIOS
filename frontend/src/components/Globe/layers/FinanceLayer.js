/**
 * FinanceLayer — Colore les pays selon la performance de leur marché boursier.
 * Utilise des entités Cesium avec polygones GeoJSON simplifiés.
 */

// Performance → couleur gradient
export function getMarketColor(changePct) {
  const Cesium = window.Cesium
  if (changePct >= 2)   return Cesium.Color.fromCssColorString('rgba(0, 255, 100, 0.30)')
  if (changePct >= 0.5) return Cesium.Color.fromCssColorString('rgba(0, 200, 80,  0.22)')
  if (changePct >= 0)   return Cesium.Color.fromCssColorString('rgba(0, 150, 60,  0.14)')
  if (changePct >= -0.5) return Cesium.Color.fromCssColorString('rgba(200, 80,  0,  0.18)')
  if (changePct >= -2)  return Cesium.Color.fromCssColorString('rgba(255, 80,  0,  0.25)')
  return Cesium.Color.fromCssColorString('rgba(255, 20,  20, 0.35)')
}

// GeoJSON très simplifié des pays avec marchés suivis
const COUNTRY_POLYGONS = {
  US: { coordinates: [[[-125, 24], [-66, 24], [-66, 49], [-125, 49], [-125, 24]]] },
  DE: { coordinates: [[[5.9, 47.3], [15.0, 47.3], [15.0, 55.1], [5.9, 55.1], [5.9, 47.3]]] },
  FR: { coordinates: [[[-4.8, 42.3], [8.2, 42.3], [8.2, 51.1], [-4.8, 51.1], [-4.8, 42.3]]] },
  JP: { coordinates: [[[129.5, 30.9], [145.8, 30.9], [145.8, 45.6], [129.5, 45.6], [129.5, 30.9]]] },
  GB: { coordinates: [[[-6.4, 49.9], [1.8, 49.9], [1.8, 60.9], [-6.4, 60.9], [-6.4, 49.9]]] },
  CN: { coordinates: [[[73.5, 18.2], [134.8, 18.2], [134.8, 53.6], [73.5, 53.6], [73.5, 18.2]]] },
}

export class FinanceLayer {
  constructor(viewer) {
    this.viewer = viewer
    this._entityIds = []
    this._visible = false
  }

  update(markets) {
    if (!this._visible) return
    this._clear()
    const Cesium = window.Cesium

    markets.forEach((market) => {
      const poly = COUNTRY_POLYGONS[market.country]
      if (!poly) return

      const color = getMarketColor(market.change_pct)
      const positions = Cesium.Cartesian3.fromDegreesArray(
        poly.coordinates[0].flat(),
      )

      const entity = this.viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          material: color,
          outline: true,
          outlineColor: color.withAlpha(0.6),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <b>${market.symbol}</b><br/>
          Prix : ${market.price?.toLocaleString('fr-FR')}<br/>
          Variation : ${market.change_pct > 0 ? '+' : ''}${market.change_pct}%
        `,
      })
      this._entityIds.push(entity.id)
    })
  }

  _clear() {
    this._entityIds.forEach((id) => {
      const e = this.viewer.entities.getById(id)
      if (e) this.viewer.entities.remove(e)
    })
    this._entityIds = []
  }

  setVisible(visible) {
    this._visible = visible
    if (!visible) this._clear()
  }

  destroy() {
    this._clear()
  }
}
