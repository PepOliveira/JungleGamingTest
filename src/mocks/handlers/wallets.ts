import { http, HttpResponse } from 'msw'
import { endpoints } from '@/contracts/endpoints'
import { createWalletRequestSchema, updateWalletRequestSchema } from '@/contracts/wallet'
import type { Wallet, WalletsResponse } from '@/contracts/wallet'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import { authenticate } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { validationFailure } from '../utils/validation'

const itemPath = `${endpoints.wallets.list}/:walletId`

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function sorted(wallets: readonly Wallet[]) {
  return [...wallets].sort((a, b) => Number(b.kind === 'primary') - Number(a.kind === 'primary'))
}

export const walletHandlers = [
  http.get(apiUrl(endpoints.wallets.list), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const body: WalletsResponse = { items: sorted(getDb().wallets[result.user.id] ?? []) }
    return HttpResponse.json(body)
  }),

  http.post(apiUrl(endpoints.wallets.create), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const parsed = createWalletRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const existing = getDb().wallets[result.user.id] ?? []
    const { kind } = parsed.data

    if (existing.some((wallet) => wallet.kind === kind)) {
      return errorResponse(
        409,
        'wallet_conflict',
        kind === 'primary'
          ? 'Você já possui uma carteira principal'
          : 'Você já possui uma carteira secundária',
      )
    }
    if (kind === 'secondary' && !existing.some((wallet) => wallet.kind === 'primary')) {
      return errorResponse(409, 'wallet_conflict', 'Cadastre a carteira principal primeiro')
    }

    const wallet: Wallet = { id: `wallet_${randomToken(6)}`, ...parsed.data }
    updateDb((db) => {
      db.wallets[result.user.id] = [...(db.wallets[result.user.id] ?? []), wallet]
    })

    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.put(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const walletId = String(params.walletId)
    const current = (getDb().wallets[result.user.id] ?? []).find((wallet) => wallet.id === walletId)
    if (!current) {
      return errorResponse(404, 'not_found', 'Carteira não encontrada')
    }

    const parsed = updateWalletRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }
    if (parsed.data.kind !== current.kind) {
      return errorResponse(409, 'wallet_conflict', 'O tipo da carteira não pode ser alterado')
    }

    const updated: Wallet = { id: current.id, ...parsed.data }
    updateDb((db) => {
      db.wallets[result.user.id] = (db.wallets[result.user.id] ?? []).map((wallet) =>
        wallet.id === walletId ? updated : wallet,
      )
    })

    return HttpResponse.json(updated)
  }),
]
