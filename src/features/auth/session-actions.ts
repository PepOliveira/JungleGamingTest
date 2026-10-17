import type { QueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/contracts/auth'
import { sessionKey } from './api/auth-queries'
import { sessionStore } from './session-store'

export const privateQueryRoots = [
  'session',
  'favorites',
  'cart',
  'orders',
  'profile',
  'wallets',
] as const

function isPrivateQuery(queryKey: readonly unknown[]) {
  return privateQueryRoots.some((root) => queryKey[0] === root)
}

export function resetPrivateData(queryClient: QueryClient) {
  void queryClient.cancelQueries({ predicate: (query) => isPrivateQuery(query.queryKey) })
  queryClient.removeQueries({ predicate: (query) => isPrivateQuery(query.queryKey) })
}

export function startSession(queryClient: QueryClient, auth: AuthResponse) {
  resetPrivateData(queryClient)
  sessionStore.set({ accessToken: auth.accessToken, expiresAt: auth.expiresAt })
  queryClient.setQueryData(sessionKey, { user: auth.user, expiresAt: auth.expiresAt })
}

export function endSession(queryClient: QueryClient) {
  sessionStore.clear()
  resetPrivateData(queryClient)
}
