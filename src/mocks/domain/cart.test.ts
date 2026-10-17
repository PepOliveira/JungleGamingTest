import { describe, expect, it } from 'vitest'
import type { Edition } from '@/contracts/nft'
import type { CartLineRecord, CouponRecord, MockDb } from '../db/types'
import { createCatalog } from '../fixtures/catalog'
import {
  addToLines,
  computeSummary,
  evaluateCoupon,
  hydrateCart,
  mergeLines,
  setLineQuantity,
} from './cart'

const now = Date.parse('2026-10-16T12:00:00.000Z')

const coupons: CouponRecord[] = [
  { code: 'KURIO10', kind: 'percent', value: '10', expiresAt: '2030-01-01T00:00:00.000Z' },
  { code: 'BEMVINDO', kind: 'fixed', value: '0.05', expiresAt: '2030-01-01T00:00:00.000Z' },
  { code: 'OLD', kind: 'percent', value: '20', expiresAt: '2025-01-01T00:00:00.000Z' },
]

const edition = (available: number): Edition => ({
  id: 'e1',
  label: '1/50',
  price: '1.19',
  available,
  supply: 50,
})

describe('evaluateCoupon', () => {
  it('finds coupons ignoring case and spaces', () => {
    expect(evaluateCoupon(coupons, ' kurio10 ', now)).toMatchObject({ ok: true })
  })

  it('distinguishes invalid from expired codes', () => {
    expect(evaluateCoupon(coupons, 'NOPE', now)).toEqual({ ok: false, reason: 'invalid' })
    expect(evaluateCoupon(coupons, 'OLD', now)).toEqual({ ok: false, reason: 'expired' })
  })
})

describe('computeSummary', () => {
  const items = [
    { unitPrice: '1.19', quantity: 2 },
    { unitPrice: '1.39', quantity: 6 },
    { unitPrice: '1.79', quantity: 9 },
  ]

  it('matches the totals shown in the design', () => {
    expect(computeSummary(items, null)).toEqual({
      subtotal: '26.83',
      discount: '0',
      networkFee: '0.016',
      total: '26.846',
    })
  })

  it('applies percentage coupons to the subtotal', () => {
    const summary = computeSummary(items, coupons[0] ?? null)
    expect(summary.discount).toBe('2.683')
    expect(summary.total).toBe('24.163')
  })

  it('caps fixed coupons at the subtotal', () => {
    const summary = computeSummary([{ unitPrice: '0.02', quantity: 1 }], coupons[1] ?? null)
    expect(summary.discount).toBe('0.02')
    expect(summary.total).toBe('0.016')
  })

  it('returns zeros for an empty cart', () => {
    expect(computeSummary([], coupons[0] ?? null)).toEqual({
      subtotal: '0',
      discount: '0',
      networkFee: '0',
      total: '0',
    })
  })
})

describe('line mutations', () => {
  it('adds new lines and merges repeated ones', () => {
    const first = addToLines([], edition(40), 'n1', 2)
    expect(first.ok && first.lines).toEqual([{ nftId: 'n1', editionId: 'e1', quantity: 2 }])
    const second = addToLines(first.ok ? first.lines : [], edition(40), 'n1', 3)
    expect(second.ok && second.lines[0]?.quantity).toBe(5)
  })

  it('refuses to exceed availability or the per-item limit', () => {
    expect(addToLines([], edition(3), 'n1', 4)).toMatchObject({ ok: false, limit: 3 })
    expect(addToLines([], edition(40), 'n1', 11)).toMatchObject({ ok: false, limit: 10 })
  })

  it('refuses sold out editions', () => {
    expect(addToLines([], edition(0), 'n1', 1)).toMatchObject({ ok: false, limit: 0 })
  })

  it('updates quantities within the limit', () => {
    const lines: CartLineRecord[] = [{ nftId: 'n1', editionId: 'e1', quantity: 1 }]
    const updated = setLineQuantity(lines, edition(5), 'n1', 4)
    expect(updated.ok && updated.lines[0]?.quantity).toBe(4)
    expect(setLineQuantity(lines, edition(5), 'n1', 6)).toMatchObject({ ok: false, limit: 5 })
  })
})

describe('hydrateCart and mergeLines', () => {
  const nfts = createCatalog()
  const db = { nfts, coupons } as unknown as MockDb
  const first = nfts[0]
  const edition1 = first?.editions[2]

  it('hydrates lines with the current catalog data', () => {
    if (!first || !edition1) throw new Error('fixture missing')
    const cart = hydrateCart(
      db,
      'guest:abc',
      {
        lines: [{ nftId: first.id, editionId: edition1.id, quantity: 2 }],
        couponCode: null,
        version: 3,
      },
      now,
    )
    expect(cart.items[0]).toMatchObject({
      name: first.name,
      tokenId: '#0042',
      editionLabel: '1/50',
      quantity: 2,
      unitPrice: edition1.price,
    })
    expect(cart.summary.subtotal).toBe('2.38')
    expect(cart.version).toBe(3)
  })

  it('drops expired coupons from the cart', () => {
    if (!first || !edition1) throw new Error('fixture missing')
    const cart = hydrateCart(
      db,
      'u',
      {
        lines: [{ nftId: first.id, editionId: edition1.id, quantity: 1 }],
        couponCode: 'OLD',
        version: 1,
      },
      now,
    )
    expect(cart.couponCode).toBeNull()
    expect(cart.summary.discount).toBe('0')
  })

  it('merges guest lines into the user cart respecting limits and sold out editions', () => {
    if (!first || !edition1) throw new Error('fixture missing')
    const target: CartLineRecord[] = [{ nftId: first.id, editionId: edition1.id, quantity: 9 }]
    const incoming: CartLineRecord[] = [
      { nftId: first.id, editionId: edition1.id, quantity: 5 },
      { nftId: 'missing', editionId: 'x', quantity: 1 },
    ]
    const merged = mergeLines(target, incoming, db)
    expect(merged).toEqual([{ nftId: first.id, editionId: edition1.id, quantity: 10 }])
  })
})
