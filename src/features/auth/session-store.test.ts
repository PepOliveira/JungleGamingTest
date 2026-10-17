import { afterEach, describe, expect, it, vi } from 'vitest'
import { sessionStore } from './session-store'

afterEach(() => {
  sessionStore.clear()
})

describe('sessionStore', () => {
  it('starts without a session and exposes the token after set', () => {
    expect(sessionStore.getAccessToken()).toBeNull()
    sessionStore.set({ accessToken: 'abc', expiresAt: '2030-01-01T00:00:00.000Z' })
    expect(sessionStore.getAccessToken()).toBe('abc')
    expect(sessionStore.getSnapshot()?.expiresAt).toBe('2030-01-01T00:00:00.000Z')
  })

  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = sessionStore.subscribe(listener)
    sessionStore.set({ accessToken: 'abc', expiresAt: '2030-01-01T00:00:00.000Z' })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    sessionStore.clear()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('runs end handlers only when a session actually ended', () => {
    const onEnd = vi.fn()
    const dispose = sessionStore.onEnd(onEnd)
    sessionStore.clear()
    expect(onEnd).not.toHaveBeenCalled()
    sessionStore.set({ accessToken: 'abc', expiresAt: '2030-01-01T00:00:00.000Z' })
    sessionStore.clear()
    expect(onEnd).toHaveBeenCalledTimes(1)
    dispose()
  })
})
