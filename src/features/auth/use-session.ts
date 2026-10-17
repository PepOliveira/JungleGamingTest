import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { User } from '@/contracts/auth'
import { sessionQueryOptions } from './api/auth-queries'
import { sessionStore } from './session-store'

export type SessionState =
  | { status: 'anonymous'; user: null }
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }

const anonymous: SessionState = { status: 'anonymous', user: null }
const loading: SessionState = { status: 'loading', user: null }

export function useSession(): SessionState {
  const stored = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
  )
  const query = useQuery({ ...sessionQueryOptions(), enabled: stored !== null })

  if (!stored) return anonymous
  if (query.data) return { status: 'authenticated', user: query.data.user }
  if (query.isPending) return loading
  return anonymous
}
