import { MOCK_SOCKET_URL } from '@/contracts/realtime'
import { env } from './env'

export function resolveSocketUrl() {
  if (env.VITE_SOCKET_URL) {
    return env.VITE_SOCKET_URL
  }
  return env.VITE_ENABLE_MOCKS ? MOCK_SOCKET_URL : window.location.origin
}
