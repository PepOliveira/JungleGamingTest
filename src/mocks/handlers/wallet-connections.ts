import { http, HttpResponse } from 'msw'
import { endpoints } from '@/contracts/endpoints'
import { createWalletConnectionRequestSchema } from '@/contracts/wallet'
import type { WalletConnection } from '@/contracts/wallet'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import { getScenario } from '../scenarios'
import { authenticate } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { validationFailure } from '../utils/validation'

const itemPath = `${endpoints.walletConnections.create}/:connectionId`

export const walletConnectionHandlers = [
  http.post(apiUrl(endpoints.walletConnections.create), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const body: unknown = await request.json().catch(() => null)
    const parsed = createWalletConnectionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const wallet = (getDb().wallets[result.user.id] ?? []).find(
      (candidate) => candidate.id === parsed.data.walletId,
    )
    if (!wallet) {
      return errorResponse(404, 'not_found', 'Carteira não encontrada')
    }

    if (getScenario().walletConnection === 'refuse') {
      return errorResponse(
        403,
        'wallet_connection_refused',
        'A carteira recusou a conexão. Tente novamente ou escolha outra carteira.',
      )
    }

    const connection: WalletConnection = {
      id: `conn_${randomToken(6)}`,
      walletId: wallet.id,
      provider: parsed.data.provider,
      network: wallet.network,
      address: wallet.address,
      connectedAt: new Date().toISOString(),
    }

    updateDb((db) => {
      db.connections[connection.id] = { ...connection, userId: result.user.id }
    })

    return HttpResponse.json(connection, { status: 201 })
  }),

  http.delete(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const connectionId = String(params.connectionId)
    updateDb((db) => {
      if (db.connections[connectionId]?.userId === result.user.id) {
        delete db.connections[connectionId]
      }
    })

    return new HttpResponse(null, { status: 204 })
  }),
]
