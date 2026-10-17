import type { EthAmount, Network } from '@/contracts/common'
import type { Quote, QuoteItem } from '@/contracts/quote'
import type { MockDb } from '../db/types'
import { computeSummary, evaluateCoupon, hydrateCart } from './cart'

export const NETWORK_FEES: Record<Network, EthAmount> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0005',
}

export const QUOTE_TTL_MS = 2 * 60_000

export type QuoteResult =
  | { ok: true; quote: Quote; signature: string }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'unavailable'; items: string[] }

export function quoteSignature(quote: Quote) {
  return JSON.stringify([
    quote.network,
    quote.items.map((item) => [item.nftId, item.editionId, item.quantity, item.unitPrice]),
    quote.couponCode,
    quote.subtotal,
    quote.discount,
    quote.networkFee,
    quote.total,
  ])
}

export function buildQuote(
  db: MockDb,
  ownerKey: string,
  network: Network,
  now: number,
  id: string,
): QuoteResult {
  const cart = hydrateCart(db, ownerKey, db.carts[ownerKey], now)

  if (cart.items.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  const unavailable = cart.items.filter(
    (item) => item.available === 0 || item.quantity > item.available,
  )
  if (unavailable.length > 0) {
    return { ok: false, reason: 'unavailable', items: unavailable.map((item) => item.name) }
  }

  const coupon = cart.couponCode ? evaluateCoupon(db.coupons, cart.couponCode, now) : null
  const summary = computeSummary(
    cart.items,
    coupon?.ok ? coupon.coupon : null,
    NETWORK_FEES[network],
  )

  const items: QuoteItem[] = cart.items.map((item) => ({
    nftId: item.nftId,
    editionId: item.editionId,
    name: item.name,
    editionLabel: item.editionLabel,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    available: item.available,
  }))

  const quote: Quote = {
    id,
    cartVersion: cart.version,
    network,
    items,
    couponCode: cart.couponCode,
    subtotal: summary.subtotal,
    discount: summary.discount,
    networkFee: summary.networkFee,
    total: summary.total,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }

  return { ok: true, quote, signature: quoteSignature(quote) }
}
