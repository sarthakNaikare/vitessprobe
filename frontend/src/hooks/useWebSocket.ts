import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addToast } from '../components/Toast'

export function useWebSocket() {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const connect = () => {
    const wsUrl = window.location.origin.replace('http', 'ws').replace('5173', '8000') + '/ws/live'

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] connected')
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'incident.new') {
            queryClient.invalidateQueries({ queryKey: ['incidents'] })
            queryClient.invalidateQueries({ queryKey: ['incidents-all'] })
            queryClient.invalidateQueries({ queryKey: ['cluster-health'] })
            addToast({
              type: 'incident',
              title: 'New incident detected',
              message: msg.data?.title || 'A new incident was created',
            })
          }
          if (msg.type === 'incident.resolved') {
            queryClient.invalidateQueries({ queryKey: ['incidents'] })
            addToast({
              type: 'resolved',
              title: 'Incident resolved',
              message: msg.data?.title || 'An incident was resolved',
            })
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        console.log('[WS] disconnected — reconnecting in 3s')
        reconnectRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    } catch { /* ignore connection errors */ }
  }

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [])
}
