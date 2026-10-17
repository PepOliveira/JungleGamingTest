import { MAX_QUANTITY_PER_ITEM } from '@/contracts/cart'
import type { Cart, CartItem, CartSummary } from '@/contracts/cart'
import type { EthAmount } from '@/contracts/common'
import type { Edition } from '@/contracts/nft'
import { ethAdd, ethMin, ethMultiply, ethPercentage, ethSub, ethSum } from '@/shared/lib/eth'
import type { CartLineRecord, CartRecord, CouponRecord, MockDb } from '../db/types'

export const NETWORK_FEE_ESTIMATE = '0.016'

export function lineId(nftId: string, editionId: string) {
  return `${nftId}__${editionId}`
}

export type CouponEvaluation =
  { ok: true; coupon: CouponRecord } | { ok: false; reason: 'invalid' | 'expired' }

export function evaluateCoupon(
  coupons: readonly CouponRecord[],
  code: string,
  now: number,
): CouponEvaluation {
  const normalized = code.trim().toLowerCase()
  const coupon = coupons.find((candidate) => candidate.code.toLowerCase() === normalized)
  if (!coupon) {
    return { ok: false, reason: 'invalid' }
  }
  if (Date.parse(coupon.expiresAt) <= now) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true, coupon }
}

type Priced = Pick<CartItem, 'unitPrice' | 'quantity'>

export function computeSummary(
  items: readonly Priced[],
  coupon: CouponRecord | null,
  networkFee: EthAmount = NETWORK_FEE_ESTIMATE,
): CartSummary {
  if (items.length === 0) {
    return { subtotal: '0', discount: '0', networkFee: '0', total: '0' }
  }

  const subtotal = ethSum(items.map((item) => ethMultiply(item.unitPrice, item.quantity)))
  const rawDiscount: EthAmount = coupon
    ? coupon.kind === 'percent'
      ? ethPercentage(subtotal, coupon.value)
      : coupon.value
    : '0'
  const discount = ethMin(rawDiscount, subtotal)

  return {
    subtotal,
    discount,
    networkFee,
    total: ethAdd(ethSub(subtotal, discount), networkFee),
  }
}

export function emptyCartRecord(): CartRecord {
  return { lines: [], couponCode: null, version: 0 }
}

export function hydrateCart(
  db: MockDb,
  ownerKey: string,
  record: CartRecord | undefined,
  now: number,
): Cart {
  const source = record ?? emptyCartRecord()

  const items = source.lines.flatMap((line): CartItem[] => {
    const nft = db.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!nft || !edition) {
      return []
    }
    return [
      {
        id: lineId(line.nftId, line.editionId),
        nftId: nft.id,
        editionId: edition.id,
        name: nft.name,
        tokenId: nft.tokenId,
        editionLabel: edition.label,
        image: nft.image,
        quantity: line.quantity,
        unitPrice: edition.price,
        lineTotal: ethMultiply(edition.price, line.quantity),
        available: edition.available,
      },
    ]
  })

  const evaluation = source.couponCode ? evaluateCoupon(db.coupons, source.couponCode, now) : null
  const coupon = evaluation?.ok ? evaluation.coupon : null

  return {
    id: `cart_${ownerKey}`,
    items,
    couponCode: coupon ? coupon.code : null,
    summary: computeSummary(items, coupon),
    version: source.version,
  }
}

export type LineMutation =
  { ok: true; lines: CartLineRecord[] } | { ok: false; message: string; limit: number }

export function quantityLimit(edition: Edition) {
  return Math.min(edition.available, MAX_QUANTITY_PER_ITEM)
}

export function addToLines(
  lines: readonly CartLineRecord[],
  edition: Edition,
  nftId: string,
  quantity: number,
): LineMutation {
  const limit = quantityLimit(edition)
  if (edition.available === 0) {
    return { ok: false, message: 'Esta edição está esgotada', limit: 0 }
  }

  const existing = lines.find((line) => line.nftId === nftId && line.editionId === edition.id)
  const next = (existing?.quantity ?? 0) + quantity
  if (next > limit) {
    return { ok: false, message: `Limite de ${limit} unidades para esta edição`, limit }
  }

  return {
    ok: true,
    lines: existing
      ? lines.map((line) => (line === existing ? { ...line, quantity: next } : line))
      : [...lines, { nftId, editionId: edition.id, quantity }],
  }
}

export function setLineQuantity(
  lines: readonly CartLineRecord[],
  edition: Edition,
  nftId: string,
  quantity: number,
): LineMutation {
  const limit = quantityLimit(edition)
  if (quantity > limit) {
    return {
      ok: false,
      message:
        limit === 0 ? 'Esta edição está esgotada' : `Limite de ${limit} unidades para esta edição`,
      limit,
    }
  }
  return {
    ok: true,
    lines: lines.map((line) =>
      line.nftId === nftId && line.editionId === edition.id ? { ...line, quantity } : line,
    ),
  }
}

export function mergeLines(
  target: readonly CartLineRecord[],
  incoming: readonly CartLineRecord[],
  db: MockDb,
): CartLineRecord[] {
  let merged = [...target]

  for (const line of incoming) {
    const edition = db.nfts
      .find((candidate) => candidate.id === line.nftId)
      ?.editions.find((candidate) => candidate.id === line.editionId)
    if (!edition || edition.available === 0) {
      continue
    }

    const existing = merged.find(
      (candidate) => candidate.nftId === line.nftId && candidate.editionId === line.editionId,
    )
    const quantity = Math.min((existing?.quantity ?? 0) + line.quantity, quantityLimit(edition))

    merged = existing
      ? merged.map((candidate) => (candidate === existing ? { ...candidate, quantity } : candidate))
      : [...merged, { nftId: line.nftId, editionId: line.editionId, quantity }]
  }

  return merged
}
