import { http, HttpResponse } from 'msw'
import { IDEMPOTENCY_HEADER, endpoints } from '@/contracts/endpoints'
import { createOrderRequestSchema, orderListQuerySchema } from '@/contracts/order'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import { createOrderRecord, orderFingerprint, toOrder } from '../domain/orders'
import { buildQuote } from '../domain/quote'
import { scheduleSettlement, settleDueOrders } from '../realtime/settlement'
import { getScenario } from '../scenarios'
import { authenticate } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { fieldFailure, validationFailure } from '../utils/validation'

const itemPath = `${endpoints.orders.list}/:orderId`

export const orderHandlers = [
  http.post(apiUrl(endpoints.orders.create), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error
    const userId = result.user.id

    const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)
    if (!idempotencyKey) {
      return errorResponse(400, 'validation_error', 'Cabeçalho Idempotency-Key ausente')
    }

    const body: unknown = await request.json().catch(() => null)
    const parsed = createOrderRequestSchema.safeParse(body)
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const input = parsed.data
    const fingerprint = orderFingerprint(input)
    const storageKey = `${userId}:${idempotencyKey}`
    const previous = getDb().idempotency[storageKey]

    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return errorResponse(
          409,
          'idempotency_conflict',
          'Esta chave de idempotência já foi usada com outro conteúdo',
        )
      }
      settleDueOrders(userId)
      const existing = getDb().orders.find((order) => order.id === previous.orderId)
      if (existing) {
        return HttpResponse.json(toOrder(existing), { status: 200 })
      }
    }

    const db = getDb()
    const wallet = (db.wallets[userId] ?? []).find((candidate) => candidate.id === input.walletId)
    const connection = db.connections[input.connectionId]

    if (
      !wallet ||
      !connection ||
      connection.userId !== userId ||
      connection.walletId !== wallet.id ||
      wallet.network !== input.network
    ) {
      return fieldFailure(
        422,
        'validation_error',
        'connectionId',
        'Conecte a carteira antes de confirmar a compra',
      )
    }

    const now = Date.now()
    const fresh = buildQuote(db, `user:${userId}`, input.network, now, `quote_${randomToken(6)}`)

    if (!fresh.ok) {
      if (fresh.reason === 'empty') {
        return fieldFailure(422, 'validation_error', 'cart', 'O carrinho está vazio')
      }
      return errorResponse(
        409,
        'availability_conflict',
        'Alguns itens não estão mais disponíveis na quantidade escolhida',
        undefined,
        { items: fresh.items },
      )
    }

    const stored = db.quotes[input.quoteId]
    const quoteIsCurrent =
      stored !== undefined &&
      stored.userId === userId &&
      stored.signature === fresh.signature &&
      Date.parse(stored.quote.expiresAt) > now

    if (!quoteIsCurrent) {
      updateDb((state) => {
        state.quotes[fresh.quote.id] = { userId, quote: fresh.quote, signature: fresh.signature }
      })
      return errorResponse(
        409,
        'quote_outdated',
        'Os valores do pedido mudaram. Revise e confirme novamente.',
        undefined,
        { quote: fresh.quote },
      )
    }

    const order = createOrderRecord({
      id: `order_${randomToken(6)}`,
      userId,
      quote: stored.quote,
      wallet,
      connection,
      collector: input.collector,
      note: input.note ? input.note : null,
      now,
      scenario: getScenario(),
      db,
    })

    updateDb((state) => {
      state.orders.push(order)
      state.idempotency[storageKey] = { fingerprint, orderId: order.id }
    })

    scheduleSettlement(order.id)

    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  http.get(apiUrl(endpoints.orders.list), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const params = new URL(request.url).searchParams
    const query = orderListQuerySchema.safeParse({ status: params.get('status') ?? undefined })
    if (!query.success) {
      return validationFailure(query.error.issues)
    }

    settleDueOrders(result.user.id)
    const items = getDb()
      .orders.filter((order) => order.userId === result.user.id)
      .filter((order) => !query.data.status || order.status === query.data.status)
      .map(toOrder)
      .reverse()

    return HttpResponse.json({ items })
  }),

  http.get(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    settleDueOrders(result.user.id)
    const order = getDb().orders.find(
      (candidate) => candidate.id === String(params.orderId) && candidate.userId === result.user.id,
    )
    if (!order) {
      return errorResponse(404, 'not_found', 'Pedido não encontrado')
    }

    return HttpResponse.json(toOrder(order))
  }),
]
