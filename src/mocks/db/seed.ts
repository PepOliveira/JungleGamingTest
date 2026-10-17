import { createCatalog } from '../fixtures/catalog'
import { createCoupons } from '../fixtures/coupons'
import { createUsers } from '../fixtures/users'
import { createWallets } from '../fixtures/wallets'
import type { MockDb } from './types'

export const SCHEMA_VERSION = 3

export function createSeedDb(): MockDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createCatalog(),
    users: createUsers(),
    favorites: { user_marina: ['nft_001', 'nft_007'], user_rafael: [] },
    carts: {},
    wallets: createWallets(),
    orders: [],
    sessions: {},
    coupons: createCoupons(),
    idempotency: {},
    eventSequence: 0,
  }
}
