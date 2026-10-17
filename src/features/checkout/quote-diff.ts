import type { Quote } from '@/contracts/quote'
import { ethCompare } from '@/shared/lib/eth'

export type QuoteChange = {
  previousTotal: string
  nextTotal: string
  direction: 'up' | 'down' | 'same'
}

export function describeQuoteChange(previous: Quote, next: Quote): QuoteChange {
  const comparison = ethCompare(next.total, previous.total)
  return {
    previousTotal: previous.total,
    nextTotal: next.total,
    direction: comparison > 0 ? 'up' : comparison < 0 ? 'down' : 'same',
  }
}

export function isQuoteExpired(quote: Quote, now: number) {
  return Date.parse(quote.expiresAt) <= now
}
