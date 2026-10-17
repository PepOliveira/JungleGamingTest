import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { sessionQueryOptions } from '@/features/auth/api/auth-queries'
import { sessionStore } from '@/features/auth/session-store'
import { resolveSocketUrl } from '@/shared/config/realtime'
import { connectRealtime } from './connect-realtime'

export function RealtimeBridge() {
  const queryClient = useQueryClient()
  const token = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getAccessToken,
    sessionStore.getAccessToken,
  )

  useEffect(
    () =>
      connectRealtime({
        queryClient,
        url: resolveSocketUrl(),
        getToken: sessionStore.getAccessToken,
        getUserId: () => queryClient.getQueryData(sessionQueryOptions().queryKey)?.user.id ?? null,
      }),
    [queryClient, token],
  )

  return null
}
