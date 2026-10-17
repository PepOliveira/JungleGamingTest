const ENGINE_OPEN = '0'
const ENGINE_PING = '2'
const ENGINE_PONG = '3'
const ENGINE_MESSAGE = '4'

const SOCKET_CONNECT = '0'
const SOCKET_DISCONNECT = '1'
const SOCKET_EVENT = '2'
const SOCKET_CONNECT_ERROR = '4'

export const PING_INTERVAL_MS = 25_000
export const PING_TIMEOUT_MS = 20_000

export type ClientFrame =
  | { kind: 'pong' }
  | { kind: 'connect'; auth: Record<string, unknown> }
  | { kind: 'disconnect' }
  | { kind: 'event'; name: string; args: unknown[] }
  | { kind: 'unknown' }

export function encodeOpen(sessionId: string) {
  return `${ENGINE_OPEN}${JSON.stringify({
    sid: sessionId,
    upgrades: [],
    pingInterval: PING_INTERVAL_MS,
    pingTimeout: PING_TIMEOUT_MS,
    maxPayload: 1_000_000,
  })}`
}

export function encodePing() {
  return ENGINE_PING
}

export function encodeConnected(socketId: string) {
  return `${ENGINE_MESSAGE}${SOCKET_CONNECT}${JSON.stringify({ sid: socketId })}`
}

export function encodeConnectError(message: string) {
  return `${ENGINE_MESSAGE}${SOCKET_CONNECT_ERROR}${JSON.stringify({ message })}`
}

export function encodeEvent(name: string, payload: unknown) {
  return `${ENGINE_MESSAGE}${SOCKET_EVENT}${JSON.stringify([name, payload])}`
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function decodeClientFrame(frame: string): ClientFrame {
  if (frame === ENGINE_PONG) {
    return { kind: 'pong' }
  }
  if (!frame.startsWith(ENGINE_MESSAGE)) {
    return { kind: 'unknown' }
  }

  const packet = frame.slice(1)
  const type = packet.charAt(0)
  const body = packet.slice(1)

  if (type === SOCKET_CONNECT) {
    const auth = body ? parseJson(body) : {}
    return { kind: 'connect', auth: isRecord(auth) ? auth : {} }
  }
  if (type === SOCKET_DISCONNECT) {
    return { kind: 'disconnect' }
  }
  if (type === SOCKET_EVENT) {
    const parsed = parseJson(body)
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      return { kind: 'event', name: parsed[0], args: parsed.slice(1) }
    }
  }
  return { kind: 'unknown' }
}
