/**
 * SeismicLayer — Affiche les séismes récents (USGS) sur le globe.
 * Taille et couleur selon la magnitude.
 */

const MAGNITUDE_CONFIG = [
  { min: 7.0, color: '#ff0022', size: 20, pulse: true },
  { min: 6.0, color: '#ff4400', size: 15, pulse: true },
  { min: 5.0, color: '#ff8800', size: 10, pulse: false },
  { min: 4.0, color: '#ffcc00', size: 7,  pulse: false },
]

function getMagConfig(magnitude) {
  for (const cfg of MAGNITUDE_CONFIG) {
    if (magnitude >= cfg.min) return cfg
  }
  return { color: '#aaaaaa', size: 5, pulse: false }
}

export class SeismicLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.points = new window.Cesium.PointPrimitiveCollection()
    viewer.scene.primitives.add(this.points)
    this._visible = false
    this._entities = [] // pour les labels cliquables
  }

  update(earthquakes) {
    if (!this._visible) return
    const Cesium = window.Cesium
    this.points.removeAll()

    earthquakes.forEach((eq) => {
      if (eq.longitude == null || eq.latitude == null) return
      const cfg = getMagConfig(eq.magnitude)
      const color = Cesium.Color.fromCssColorString(cfg.color)

      this.points.add({
        position: Cesium.Cartesian3.fromDegrees(eq.longitude, eq.latitude, 0),
        color: color.withAlpha(0.85),
        pixelSize: cfg.size,
        outlineColor: color.withAlpha(0.4),
        outlineWidth: cfg.size * 0.8,
        scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 1e7, 0.5),
        id: eq.id,
      })
    })
  }

  setVisible(visible) {
    this._visible = visible
    this.points.show = visible
    if (!visible) this.points.removeAll()
  }

  destroy() {
    try { this.viewer.scene.primitives.remove(this.points) } catch { /* ignore */ }
  }
}
