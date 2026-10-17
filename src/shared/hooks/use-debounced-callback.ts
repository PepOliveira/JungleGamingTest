import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => cancel, [cancel])

  return useCallback(
    (...args: TArgs) => {
      cancel()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        callbackRef.current(...args)
      }, delayMs)
    },
    [cancel, delayMs],
  )
}
