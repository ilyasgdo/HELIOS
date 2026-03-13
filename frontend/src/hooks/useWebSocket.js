import { useEffect, useRef, useCallback } from 'react'
import { useGlobeStore } from '../stores/globeStore'
import { useAlertsStore } from '../stores/alertsStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const isMounted = useRef(true)

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data)
      dispatch(message)
    } catch (e) {
      // Silently ignore malformed messages
    }
  }, [])

  const connect = useCallback(() => {
    if (!isMounted.current) return

    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        // Connected
      }

      ws.onmessage = handleMessage

      ws.onclose = () => {
        if (isMounted.current) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
        }
      }

      wsRef.current = ws
    } catch {
      // Retry on error
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }, [handleMessage])

  useEffect(() => {
    isMounted.current = true
    connect()

    return () => {
      isMounted.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}

function dispatch(message) {
  switch (message.type) {
    case 'aviation':
      useGlobeStore.getState().updateAviationData(message.data)
      break
    case 'news':
      useGlobeStore.getState().updateNewsData(message.data)
      break
    case 'finance':
      useGlobeStore.getState().updateFinanceData(message.data)
      break
    case 'seismic':
      useGlobeStore.getState().updateSeismicData(message.data)
      useAlertsStore.getState().addSeismicAlerts(message.data)
      break
    case 'alerts':
      useAlertsStore.getState().addAlerts(message.data)
      break
    default:
      break
  }
}
