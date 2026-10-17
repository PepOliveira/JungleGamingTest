import { endSession, resetPrivateData } from '@/features/auth/session-actions'
import { SESSION_STORAGE_KEY, sessionStore } from '@/features/auth/session-store'
import { stripAuthParams } from '@/features/auth/search'
import { configureHttpClient } from '@/shared/api/http-client'
import { mergeGuestCartIntoUser } from '@/features/cart/merge-guest-cart'
import { announce } from '@/shared/lib/announcer'
import { queryClient } from './query-client'
import { router } from './router'

function handleUnauthorized() {
  if (!sessionStore.getAccessToken()) {
    return
  }

  endSession(queryClient)
  announce('Sua sessão expirou. Entre novamente para continuar.')

  const returnTo = stripAuthParams(window.location.href, window.location.origin)
  const separator = returnTo.includes('?') ? '&' : '?'
  router.history.replace(
    `${returnTo}${separator}auth=entrar&motivo=sessao-expirada&retorno=${encodeURIComponent(returnTo)}`,
  )
  void router.invalidate()
}

export function bootstrapApp() {
  configureHttpClient({
    getAccessToken: sessionStore.getAccessToken,
    onUnauthorized: handleUnauthorized,
  })

  sessionStore.onStart(() => {
    void mergeGuestCartIntoUser(queryClient).catch(() => undefined)
  })

  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== SESSION_STORAGE_KEY) {
      return
    }
    sessionStore.syncFromStorage()
    resetPrivateData(queryClient)
    void router.invalidate()
  })
}
