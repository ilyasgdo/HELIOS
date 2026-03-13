/**
 * useGlobeData — Charge les données initiales via REST au démarrage
 * (avant que le WebSocket ne prenne le relais avec les mises à jour temps réel).
 */
import { useEffect } from 'react'
import { useGlobeStore } from '../stores/globeStore'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function safeFetch(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useGlobeData() {
  const {
    updateAviationData,
    updateNewsData,
    updateFinanceData,
    updateSeismicData,
  } = useGlobeStore()

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Chargement en parallèle au démarrage
      const [aviation, news, finance, seismic] = await Promise.all([
        safeFetch(`${BASE}/api/aviation/`),
        safeFetch(`${BASE}/api/news/latest`),
        safeFetch(`${BASE}/api/finance/markets`),
        safeFetch(`${BASE}/api/weather/earthquakes`),
      ])

      if (cancelled) return

      if (aviation) updateAviationData(aviation)
      if (news) updateNewsData(news)
      if (finance) updateFinanceData(finance)
      if (seismic) updateSeismicData(seismic)
    }

    load()
    return () => { cancelled = true }
  }, [updateAviationData, updateNewsData, updateFinanceData, updateSeismicData])
}
