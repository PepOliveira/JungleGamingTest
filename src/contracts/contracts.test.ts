import { describe, expect, it } from 'vitest'
import {
  createWalletRequestSchema,
  ethAmountSchema,
  nftListQuerySchema,
  nftUpdatedEventSchema,
  quantitySchema,
} from './index'

describe('contracts', () => {
  it('requires ETH amounts as decimal strings', () => {
    expect(ethAmountSchema.safeParse('1.19').success).toBe(true)
    expect(ethAmountSchema.safeParse(1.19).success).toBe(false)
    expect(ethAmountSchema.safeParse('1,19').success).toBe(false)
    expect(ethAmountSchema.safeParse('-1').success).toBe(false)
  })

  it('requires integer quantities', () => {
    expect(quantitySchema.safeParse(2).success).toBe(true)
    expect(quantitySchema.safeParse(1.5).success).toBe(false)
    expect(quantitySchema.safeParse(0).success).toBe(false)
  })

  it('applies defaults to the catalog query', () => {
    expect(nftListQuerySchema.parse({})).toEqual({
      collections: [],
      networks: [],
      tab: 'all',
      sort: 'recent',
      page: 1,
      pageSize: 9,
    })
  })

  it('coerces page values coming from the URL', () => {
    expect(nftListQuerySchema.parse({ page: '3' }).page).toBe(3)
  })

  it('validates wallet addresses per network', () => {
    const evm = {
      label: 'Principal',
      holderName: 'Marina Duarte',
      profileName: 'Marina Duarte',
      alias: null,
      provider: 'metamask',
      referralCode: 'KURIO-1',
      contactEmail: 'm@kurio.dev',
      ensName: { name: 'marina', suffix: '.eth' },
      address: '0x52908400098527886E0F7030069857D2E4169EE7',
      network: 'ethereum',
      kind: 'primary',
    }
    expect(createWalletRequestSchema.safeParse(evm).success).toBe(true)
    expect(createWalletRequestSchema.safeParse({ ...evm, address: '0x123' }).success).toBe(false)
    expect(
      createWalletRequestSchema.safeParse({
        ...evm,
        network: 'solana',
        address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
      }).success,
    ).toBe(true)
  })

  it('validates realtime events with stable identity and version', () => {
    const event = {
      eventId: 'evt_1',
      type: 'nft.updated',
      version: 4,
      occurredAt: '2026-10-16T12:00:00.000Z',
      resource: { type: 'nft', id: 'nft_1' },
      data: {
        price: '1.20',
        originalPrice: null,
        available: 3,
        editions: [{ id: 'ed_1', price: '1.20', available: 3 }],
      },
    }
    expect(nftUpdatedEventSchema.safeParse(event).success).toBe(true)
    expect(nftUpdatedEventSchema.safeParse({ ...event, version: undefined }).success).toBe(false)
  })
})
