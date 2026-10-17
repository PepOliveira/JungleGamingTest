import { ws } from 'msw'
import { MOCK_SOCKET_URL, realtimeEventNames } from '@/contracts/realtime'
import type { RealtimeEvent } from '@/contracts/realtime'
import { resolveSessionUserId } from '../utils/auth'
import { randomToken } from '../utils/ids'
import {
  PING_INTERVAL_MS,
  decodeClientFrame,
  encodeConnectError,
  encodeConnected,
  encodeEvent,
  encodeOpen,
  encodePing,
} from './protocol'

type Subscriber = {
  send: (frame: string) => void
  close: () => void
  userId: string | null
  ready: boolean
}

const subscribers = new Map<string, Subscriber>()
let offline = false
let lastEvent: RealtimeEvent | null = null

export function publish(event: RealtimeEvent) {
  lastEvent = event
  const frame = encodeEvent(event.type, event)
  subscribers.forEach((subscriber) => {
    if (!subscriber.ready) return
    if (event.type === realtimeEventNames.orderUpdated && event.userId !== subscriber.userId) return
    subscriber.send(frame)
  })
}

export function publishAll(events: RealtimeEvent[]) {
  events.forEach(publish)
}

export function broadcastRaw(event: RealtimeEvent) {
  lastEvent = event
  const frame = encodeEvent(event.type, event)
  subscribers.forEach((subscriber) => {
    if (subscriber.ready) subscriber.send(frame)
  })
}

export function replayLastEvent() {
  if (lastEvent) broadcastRaw(lastEvent)
}

export function hasSubscribers() {
  return subscribers.size > 0
}

export function disconnectAll() {
  Array.from(subscribers.values()).forEach((subscriber) => subscriber.close())
}

export function setOffline(value: boolean) {
  offline = value
  if (value) disconnectAll()
}

export function isOffline() {
  return offline
}

const link = ws.link(MOCK_SOCKET_URL)

export const socketHandlers = [
  link.addEventListener('connection', ({ client }) => {
    if (offline) {
      client.close(1013, 'offline')
      return
    }

    const subscriber: Subscriber = {
      send: (frame) => client.send(frame),
      close: () => client.close(1012, 'restart'),
      userId: null,
      ready: false,
    }
    subscribers.set(client.id, subscriber)

    client.send(encodeOpen(`eio_${randomToken(6)}`))

    const pingTimer = setInterval(() => client.send(encodePing()), PING_INTERVAL_MS)

    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return
      const frame = decodeClientFrame(event.data)

      if (frame.kind === 'connect') {
        const token = typeof frame.auth.token === 'string' ? frame.auth.token : null
        const userId = resolveSessionUserId(token)
        if (token && !userId) {
          client.send(encodeConnectError('unauthorized'))
          return
        }
        subscriber.userId = userId
        subscriber.ready = true
        client.send(encodeConnected(`sck_${randomToken(6)}`))
      }
    })

    client.addEventListener('close', () => {
      clearInterval(pingTimer)
      subscribers.delete(client.id)
    })
  }),
]
