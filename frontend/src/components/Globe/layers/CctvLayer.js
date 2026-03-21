import * as CesiumLib from 'cesium'

export class CctvLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.entities = []
    this.isVisible = false
  }

  update(cctvData) {
    // Nettoyer les anciennes entités
    this.entities.forEach((entity) => {
      this.viewer.entities.remove(entity)
    })
    this.entities = []

    if (!cctvData || cctvData.length === 0) return

    cctvData.forEach((cam) => {
      if (!cam.latitude || !cam.longitude) return

      const entity = this.viewer.entities.add({
        position: CesiumLib.Cartesian3.fromDegrees(cam.longitude, cam.latitude, 50),
        billboard: {
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBmZmNjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1LjYgMTEuNkwyMiA3djEwbC02LjQtNC41djEuNWEyIDIgMCAwIDEtMiAyaC0xMGEyIDIgMCAwIDEtMi0ydi0xMGEyIDIgMCAwIDEgMi0yaDEwYTIgMiAwIDAgMSAyIDJ6Ii8+PC9zdmc+',
          scale: 0.8,
          color: CesiumLib.Color.WHITE,
          verticalOrigin: CesiumLib.VerticalOrigin.BOTTOM,
          heightReference: CesiumLib.HeightReference.RELATIVE_TO_GROUND
        },
        label: {
          text: `CCTV: ${cam.city}`,
          font: '12px Inter, sans-serif',
          fillColor: CesiumLib.Color.CYAN,
          style: CesiumLib.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: CesiumLib.VerticalOrigin.TOP,
          pixelOffset: new CesiumLib.Cartesian2(0, 5),
          showBackground: true,
          backgroundColor: new CesiumLib.Color(0, 0, 0, 0.7),
          distanceDisplayCondition: new CesiumLib.DistanceDisplayCondition(0, 3000000)
        },
        properties: {
          type: 'cctv',
          camData: cam
        },
        show: this.isVisible
      })
      this.entities.push(entity)
    })
  }

  setVisible(visible) {
    this.isVisible = visible
    this.entities.forEach(entity => {
      entity.show = visible
    })
  }

  destroy() {
    this.entities.forEach(entity => {
      try { this.viewer.entities.remove(entity) } catch { /* ignore */ }
    })
    this.entities = []
  }
}
