import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { walletSchema, walletsResponseSchema } from '@/contracts/wallet'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiRequest } from '@/shared/api/request'
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

type Headers = Record<string, string>

async function login(index: number): Promise<Headers> {
  const auth = await apiRequest(
    { method: 'POST', url: endpoints.auth.login, data: demoCredentials[index] },
    authResponseSchema,
  )
  return { Authorization: `Bearer ${auth.accessToken}` }
}

const list = (headers?: Headers) =>
  apiRequest({ url: endpoints.wallets.list, headers }, walletsResponseSchema)
const create = (headers: Headers, data: unknown) =>
  apiRequest({ method: 'POST', url: endpoints.wallets.create, headers, data }, walletSchema)
const update = (headers: Headers, id: string, data: unknown) =>
  apiRequest({ method: 'PUT', url: endpoints.wallets.detail(id), headers, data }, walletSchema)

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) throw new Error('Expected an ApiError')
  return error as ApiError
}

const evm = '0x52908400098527886E0F7030069857D2E4169EE7'

const wallet = (kind: 'primary' | 'secondary', overrides: Record<string, unknown> = {}) => ({
  kind,
  label: 'Minha carteira',
  holderName: 'Rafael Lima',
  profileName: 'Rafael Lima',
  network: 'ethereum',
  address: evm,
  alias: '',
  provider: 'metamask',
  referralCode: 'kurio-2026',
  contactEmail: 'criadora@kurio.dev',
  ensName: { name: 'rafael', suffix: '.eth' },
  ...overrides,
})

describe('GET /wallets', () => {
  it('requires a session', async () => {
    expect((await failure(list())).status).toBe(401)
  })

  it('lists the primary wallet first', async () => {
    const { items } = await list(await login(0))
    expect(items.map((item) => item.kind)).toEqual(['primary', 'secondary'])
  })

  it('isolates wallets between users', async () => {
    const { items } = await list(await login(1))
    expect(items.map((item) => item.id)).toEqual(['wallet_rafael_main'])
  })
})

describe('POST /wallets', () => {
  it('creates the secondary wallet and normalizes the optional alias and referral code', async () => {
    const headers = await login(1)
    const created = await create(headers, wallet('secondary'))
    expect(created).toMatchObject({ kind: 'secondary', alias: null, referralCode: 'KURIO-2026' })
    expect((await list(headers)).items).toHaveLength(2)
  })

  it('rejects a second wallet of the same kind', async () => {
    const headers = await login(1)
    expect((await failure(create(headers, wallet('primary')))).code).toBe('wallet_conflict')
    await create(headers, wallet('secondary'))
    expect((await failure(create(headers, wallet('secondary')))).code).toBe('wallet_conflict')
  })

  it('validates the address for the selected network', async () => {
    const headers = await login(1)
    const evmError = await failure(create(headers, wallet('secondary', { address: '0x123' })))
    expect(evmError.status).toBe(422)
    expect(evmError.fieldErrors.address).toBeDefined()
    const solanaError = await failure(
      create(headers, wallet('secondary', { network: 'solana', address: evm })),
    )
    expect(solanaError.fieldErrors.address).toBeDefined()
  })

  it('validates required fields with field errors', async () => {
    const error = await failure(
      create(
        await login(1),
        wallet('secondary', { label: '', referralCode: '!', contactEmail: 'x' }),
      ),
    )
    expect(Object.keys(error.fieldErrors)).toEqual(
      expect.arrayContaining(['label', 'referralCode', 'contactEmail']),
    )
  })
})

describe('PUT /wallets/:id', () => {
  it('updates a wallet of the user', async () => {
    const headers = await login(1)
    const updated = await update(
      headers,
      'wallet_rafael_main',
      wallet('primary', { label: 'Renomeada', provider: 'coinbase' }),
    )
    expect(updated).toMatchObject({ id: 'wallet_rafael_main', label: 'Renomeada' })
    expect((await list(headers)).items[0]?.label).toBe('Renomeada')
  })

  it('does not expose or change wallets of other users', async () => {
    const error = await failure(update(await login(1), 'wallet_marina_main', wallet('primary')))
    expect(error.kind).toBe('not_found')
  })

  it('does not allow changing the kind', async () => {
    const error = await failure(update(await login(1), 'wallet_rafael_main', wallet('secondary')))
    expect(error.code).toBe('wallet_conflict')
  })
})
