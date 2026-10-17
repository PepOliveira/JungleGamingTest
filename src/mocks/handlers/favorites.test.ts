import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { favoritesResponseSchema } from '@/contracts/favorites'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiCommand, apiRequest } from '@/shared/api/request'
import { resetDb } from '../db/store'
import { demoCredentials } from '../fixtures/users'
import { setScenario } from '../scenarios'
import { server } from '../server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario('instant')
  resetDb()
})

async function login(index: number) {
  const credentials = demoCredentials[index]
  const auth = await apiRequest(
    { method: 'POST', url: endpoints.auth.login, data: credentials },
    authResponseSchema,
  )
  return { Authorization: `Bearer ${auth.accessToken}` }
}

const list = (headers?: Record<string, string>) =>
  apiRequest({ url: endpoints.favorites.list, headers }, favoritesResponseSchema)

const add = (nftId: string, headers?: Record<string, string>) =>
  apiCommand({ method: 'PUT', url: endpoints.favorites.item(nftId), headers })

const remove = (nftId: string, headers?: Record<string, string>) =>
  apiCommand({ method: 'DELETE', url: endpoints.favorites.item(nftId), headers })

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) throw new Error('Expected an ApiError')
  return error as ApiError
}

describe('favorites', () => {
  it('requires authentication', async () => {
    expect((await failure(list())).status).toBe(401)
    expect((await failure(add('nft_003'))).status).toBe(401)
    expect((await failure(remove('nft_003'))).status).toBe(401)
  })

  it('lists the seeded favorites of the signed in user', async () => {
    const headers = await login(0)
    const { items } = await list(headers)
    expect(items.map((item) => item.id)).toEqual(['nft_001', 'nft_007'])
  })

  it('adds favorites idempotently and keeps insertion order', async () => {
    const headers = await login(0)
    await add('nft_003', headers)
    await add('nft_003', headers)
    const { items } = await list(headers)
    expect(items.map((item) => item.id)).toEqual(['nft_001', 'nft_007', 'nft_003'])
  })

  it('removes favorites idempotently', async () => {
    const headers = await login(0)
    await remove('nft_001', headers)
    await remove('nft_001', headers)
    const { items } = await list(headers)
    expect(items.map((item) => item.id)).toEqual(['nft_007'])
  })

  it('rejects unknown NFTs', async () => {
    const headers = await login(0)
    expect((await failure(add('nft_999', headers))).kind).toBe('not_found')
  })

  it('keeps favorites isolated between users', async () => {
    const marina = await login(0)
    const rafael = await login(1)
    await add('nft_010', rafael)
    expect((await list(rafael)).items.map((item) => item.id)).toEqual(['nft_010'])
    expect((await list(marina)).items.map((item) => item.id)).toEqual(['nft_001', 'nft_007'])
  })
})
