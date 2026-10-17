import type { useRouter } from '@tanstack/react-router'
import { sanitizeReturnPath, stripAuthParams } from './search'

type Router = ReturnType<typeof useRouter>

export function closeAuthDialog(router: Router) {
  router.history.replace(stripAuthParams(window.location.href, window.location.origin))
}

export function finishAuth(router: Router, returnTo: string | undefined) {
  const target = sanitizeReturnPath(returnTo, window.location.origin)
  if (target) {
    router.history.push(target)
    return
  }
  closeAuthDialog(router)
}
