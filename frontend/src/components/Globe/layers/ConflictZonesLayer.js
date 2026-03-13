/**
 * ConflictZonesLayer — Polygones GeoJSON des zones de conflit actives.
 * Affiche des zones colorées semi-transparentes sur le globe.
 */

const CONFLICT_ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Ukraine', intensity: 'high', since: '2022' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[22.1, 44.4], [40.2, 44.4], [40.2, 52.4], [22.1, 52.4], [22.1, 44.4]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Gaza Strip', intensity: 'high', since: '2023' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[34.2, 31.2], [34.6, 31.2], [34.6, 31.6], [34.2, 31.6], [34.2, 31.2]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Sudan', intensity: 'medium', since: '2023' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[21.8, 9.0], [38.6, 9.0], [38.6, 22.0], [21.8, 22.0], [21.8, 9.0]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Myanmar', intensity: 'medium', since: '2021' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[92.2, 15.8], [101.2, 15.8], [101.2, 28.5], [92.2, 28.5], [92.2, 15.8]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Syria', intensity: 'medium', since: '2011' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[35.7, 32.3], [42.4, 32.3], [42.4, 37.3], [35.7, 37.3], [35.7, 32.3]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Yemen', intensity: 'high', since: '2014' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[41.8, 11.9], [54.6, 11.9], [54.6, 19.0], [41.8, 19.0], [41.8, 11.9]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Somalia', intensity: 'medium', since: '1991' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[40.9, -1.7], [51.4, -1.7], [51.4, 12.0], [40.9, 12.0], [40.9, -1.7]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Sahel (Mali/Niger/Burkina)', intensity: 'medium', since: '2012' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-5.5, 11.0], [15.0, 11.0], [15.0, 22.0], [-5.5, 22.0], [-5.5, 11.0]]],
      },
    },
  ],
}

const INTENSITY_COLORS = {
  high:   { fill: 'rgba(255, 30, 30, 0.18)',  outline: 'rgba(255, 30, 30, 0.7)',  width: 2 },
  medium: { fill: 'rgba(255, 140, 0, 0.14)',  outline: 'rgba(255, 140, 0, 0.6)',  width: 1.5 },
  low:    { fill: 'rgba(255, 220, 0, 0.10)',  outline: 'rgba(255, 220, 0, 0.5)',  width: 1 },
}

export class ConflictZonesLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.dataSource = null
    this._visible = false
  }

  async load() {
    if (this.dataSource) return

    const Cesium = window.Cesium

    try {
      const ds = await Cesium.GeoJsonDataSource.load(CONFLICT_ZONES, {
        clampToGround: true,
      })

      // Personnaliser chaque entité
      ds.entities.values.forEach((entity) => {
        const intensity = entity.properties?.intensity?.getValue() || 'medium'
        const cfg = INTENSITY_COLORS[intensity] || INTENSITY_COLORS.medium

        if (entity.polygon) {
          entity.polygon.material = Cesium.Color.fromCssColorString(cfg.fill)
          entity.polygon.outlineColor = Cesium.Color.fromCssColorString(cfg.outline)
          entity.polygon.outline = true
          entity.polygon.outlineWidth = cfg.width
          entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
        }
      })

      this.dataSource = ds
      this.viewer.dataSources.add(ds)
      ds.show = this._visible
    } catch (e) {
      console.error('[ConflictZones] load error:', e)
    }
  }

  setVisible(visible) {
    this._visible = visible
    if (this.dataSource) {
      this.dataSource.show = visible
    }
    if (visible && !this.dataSource) {
      this.load()
    }
  }

  destroy() {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource)
    }
  }
}
