/**
 * AviationLayer — Affiche les avions en temps réel sur le globe CesiumJS.
 * Utilise un BillboardCollection pour les icônes + PolylineCollection pour les trainées.
 */

const PLANE_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#00d4ff" d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
</svg>`)}`

export class AviationLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.billboards = new window.Cesium.BillboardCollection()
    viewer.scene.primitives.add(this.billboards)
    this._visible = false
  }

  update(planes) {
    if (!this._visible) return
    this.billboards.removeAll()

    const Cesium = window.Cesium

    planes.forEach((plane) => {
      if (plane.on_ground) return
      const lon = plane.longitude
      const lat = plane.latitude
      if (lon == null || lat == null) return

      this.billboards.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, (plane.altitude || 10000)),
        image: PLANE_ICON,
        scale: 0.9,
        color: Cesium.Color.CYAN,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        rotation: Cesium.Math.toRadians(-(plane.heading || 0)),
        alignedAxis: Cesium.Cartesian3.UNIT_Z,
        scaleByDistance: new Cesium.NearFarScalar(1e5, 1.2, 8e6, 0.3),
        translucencyByDistance: new Cesium.NearFarScalar(5e6, 1.0, 2e7, 0.0),
        id: plane.icao24,
      })
    })
  }

  setVisible(visible) {
    this._visible = visible
    this.billboards.show = visible
    if (!visible) this.billboards.removeAll()
  }

  destroy() {
    try {
      this.viewer.scene.primitives.remove(this.billboards)
    } catch { /* ignore */ }
  }
}
