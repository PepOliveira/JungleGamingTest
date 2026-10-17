import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from './api/auth-queries'
import { sessionStore } from './session-store'

type GuardArgs = {
  context: { queryClient: QueryClient }
  location: { href: string }
}

export async function requireAuthenticated({ context, location }: GuardArgs) {
  const toLogin = () =>
    redirect({ to: '/', search: { auth: 'entrar', retorno: location.href }, replace: true })

  if (!sessionStore.getAccessToken()) {
    throw toLogin()
  }

  try {
    await context.queryClient.ensureQueryData(sessionQueryOptions())
  } catch {
    throw toLogin()
  }
}
