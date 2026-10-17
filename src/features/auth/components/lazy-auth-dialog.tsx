import { useSearch } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { authSearchSchema } from '../search'

const loadAuthDialog = () => import('./auth-dialog')
const AuthDialog = lazy(() => loadAuthDialog().then((module) => ({ default: module.AuthDialog })))

export function LazyAuthDialog() {
  const search = authSearchSchema.parse(useSearch({ strict: false }))
  const requested = search.auth !== undefined
  const [loaded, setLoaded] = useState(requested)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  if (requested && !loaded) {
    setLoaded(true)
  }

  useEffect(() => {
    function remember(event: FocusEvent) {
      const target = event.target
      if (target instanceof HTMLElement && !target.closest('[role="dialog"]')) {
        returnFocusRef.current = target
      }
    }
    document.addEventListener('focusin', remember)
    return () => document.removeEventListener('focusin', remember)
  }, [])

  useEffect(() => {
    if (loaded) return
    const schedule =
      window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 2000))
    const handle = schedule(() => void loadAuthDialog())
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle)
    }
  }, [loaded])

  if (!loaded) return null

  return (
    <Suspense fallback={null}>
      <AuthDialog returnFocusRef={returnFocusRef} />
    </Suspense>
  )
}
