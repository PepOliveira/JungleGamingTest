import { http, HttpResponse } from 'msw'
import { endpoints } from '@/contracts/endpoints'
import { createQuoteRequestSchema } from '@/contracts/quote'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import { buildQuote } from '../domain/quote'
import { authenticate } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { validationFailure } from '../utils/validation'

export const quoteHandlers = [
  http.post(apiUrl(endpoints.quotes.create), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const body: unknown = await request.json().catch(() => null)
    const parsed = createQuoteRequestSchema.safeParse(body)
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const quote = buildQuote(
      getDb(),
      `user:${result.user.id}`,
      parsed.data.network,
      Date.now(),
      `quote_${randomToken(6)}`,
    )

    if (!quote.ok) {
      if (quote.reason === 'empty') {
        return errorResponse(422, 'validation_error', 'O carrinho está vazio', {
          cart: ['O carrinho está vazio'],
        })
      }
      return errorResponse(
        409,
        'availability_conflict',
        'Alguns itens não estão mais disponíveis na quantidade escolhida',
        undefined,
        { items: quote.items },
      )
    }

    updateDb((db) => {
      db.quotes[quote.quote.id] = {
        userId: result.user.id,
        quote: quote.quote,
        signature: quote.signature,
      }
    })

    return HttpResponse.json(quote.quote, { status: 201 })
  }),
]
