import type { NftDetail } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import type { User } from '@/contracts/auth'
import type { Wallet, WalletConnection } from '@/contracts/wallet'

export type NftRecord = NftDetail & {
  listedAt: string
  popularity: number
  isNew: boolean
  isTrending: boolean
}

export type UserRecord = User & {
  passwordSalt: string
  passwordHash: string
}

export type CouponRecord = {
  code: string
  kind: 'percent' | 'fixed'
  value: string
  expiresAt: string
}

export type CartLineRecord = {
  nftId: string
  editionId: string
  quantity: number
}

export type CartRecord = {
  lines: CartLineRecord[]
  couponCode: string | null
  version: number
}

export type OrderRecord = Order & {
  userId: string
  settleAt: string
  outcome: 'confirmed' | 'declined'
}

export type QuoteRecord = {
  userId: string
  quote: Quote
  signature: string
}

export type ConnectionRecord = WalletConnection & {
  userId: string
}

export type SessionRecord = {
  userId: string
  expiresAt: string
}

export type IdempotencyRecord = {
  fingerprint: string
  orderId: string
}

export type MockDb = {
  schemaVersion: number
  nfts: NftRecord[]
  users: UserRecord[]
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  wallets: Record<string, Wallet[]>
  orders: OrderRecord[]
  quotes: Record<string, QuoteRecord>
  connections: Record<string, ConnectionRecord>
  sessions: Record<string, SessionRecord>
  coupons: CouponRecord[]
  idempotency: Record<string, IdempotencyRecord>
  eventSequence: number
}
