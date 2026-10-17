import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { sessionKey } from './api/auth-queries'
import { endSession, resetPrivateData, startSession } from './session-actions'
import { sessionStore } from './session-store'

const auth = {
  user: {
    id: 'user_1',
    username: 'marina',
    name: 'Marina',
    ensName: null,
    walletNickname: null,
    email: 'm@kurio.dev',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  accessToken: 'token-1',
  expiresAt: '2030-01-01T00:00:00.000Z',
}

afterEach(() => {
  sessionStore.clear()
})

describe('session actions', () => {
  it('drops private cache from the previous user when a new session starts', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['favorites', 'user_old'], ['nft_1'])
    queryClient.setQueryData(['nfts', 'list'], ['public'])

    startSession(queryClient, auth)

    expect(queryClient.getQueryData(['favorites', 'user_old'])).toBeUndefined()
    expect(queryClient.getQueryData(['nfts', 'list'])).toEqual(['public'])
    expect(queryClient.getQueryData(sessionKey)).toEqual({
      user: auth.user,
      expiresAt: auth.expiresAt,
    })
    expect(sessionStore.getAccessToken()).toBe('token-1')
  })

  it('clears the token and every private query on logout, keeping public data', () => {
    const queryClient = new QueryClient()
    startSession(queryClient, auth)
    queryClient.setQueryData(['cart', 'user_1'], { items: [] })
    queryClient.setQueryData(['orders', 'user_1'], [])
    queryClient.setQueryData(['nfts', 'detail', 'nft_1'], { id: 'nft_1' })

    endSession(queryClient)

    expect(sessionStore.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(sessionKey)).toBeUndefined()
    expect(queryClient.getQueryData(['cart', 'user_1'])).toBeUndefined()
    expect(queryClient.getQueryData(['orders', 'user_1'])).toBeUndefined()
    expect(queryClient.getQueryData(['nfts', 'detail', 'nft_1'])).toEqual({ id: 'nft_1' })
  })

  it('exposes the reset on its own', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['wallets', 'user_1'], [])
    resetPrivateData(queryClient)
    expect(queryClient.getQueryData(['wallets', 'user_1'])).toBeUndefined()
  })
})
