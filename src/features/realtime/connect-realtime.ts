import type { QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { realtimeEventNames } from '@/contracts/realtime'
import { whenRuntimeReady } from '@/shared/config/runtime-ready'
import { announce } from '@/shared/lib/announcer'
import { handleNftPayload, handleOrderPayload, reconcileAfterReconnect } from './apply-events'
import { createEventLedger } from './event-ledger'
import { realtimeStatus } from './realtime-status'

type ConnectOptions = {
  queryClient: QueryClient
  url: string
  getToken: () => string | null
  getUserId: () => string | null
}

export function connectRealtime({ queryClient, url, getToken, getUserId }: ConnectOptions) {
  const ledger = createEventLedger()
  const context = { queryClient, ledger, getUserId }
  let hasConnected = false
  let outageAnnounced = false

  let socket: Socket | null = null
  let cancelled = false

  async function start() {
    await whenRuntimeReady()
    if (cancelled) return
    const { io } = await import('socket.io-client')
    if (cancelled) return

    const client = io(url, {
      autoConnect: false,
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      auth: (callback) => {
        const token = getToken()
        callback(token ? { token } : {})
      },
    })
    socket = client

    client.on('connect', () => {
      realtimeStatus.set('online')
      if (hasConnected) {
        reconcileAfterReconnect(queryClient)
        if (outageAnnounced) {
          announce('Atualizações em tempo real restabelecidas.')
        }
      }
      hasConnected = true
      outageAnnounced = false
    })

    client.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') return
      realtimeStatus.set('offline')
      if (!outageAnnounced) {
        outageAnnounced = true
        announce('Atualizações em tempo real indisponíveis. Tentando reconectar.', {
          visible: true,
        })
      }
    })

    client.on('connect_error', (error) => {
      if (error.message === 'unauthorized') {
        client.disconnect()
        realtimeStatus.set('idle')
        return
      }
      realtimeStatus.set('offline')
    })

    client.on(realtimeEventNames.nftUpdated, (payload: unknown) => {
      handleNftPayload(payload, context)
    })
    client.on(realtimeEventNames.orderUpdated, (payload: unknown) => {
      handleOrderPayload(payload, context)
    })

    client.connect()
  }

  realtimeStatus.set('connecting')
  void start()

  return () => {
    cancelled = true
    socket?.removeAllListeners()
    socket?.disconnect()
    ledger.clear()
    realtimeStatus.set('idle')
  }
}
