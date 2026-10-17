import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import type { Network } from '@/contracts/common'
import { orderSchema } from '@/contracts/order'
import type { Order, OrderItem, OrderStatus } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import type { Wallet, WalletConnection } from '@/contracts/wallet'
import type { CartLineRecord, MockDb, OrderRecord } from '../db/types'
import type { Scenario } from '../scenarios'
import { hydrateCart } from './cart'

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

export const DECLINE_REASON = 'O pagamento foi recusado pela carteira.'

export function transactionHashFor(orderId: string) {
  return `0x${bytesToHex(sha256(utf8ToBytes(orderId)))}`
}

export function explorerUrlFor(network: Network, hash: string) {
  return `${EXPLORERS[network]}${hash}`
}

export function orderFingerprint(body: {
  quoteId: string
  walletId: string
  connectionId: string
  network: string
  collector: { fullName: string; email: string }
  note?: string
}) {
  return JSON.stringify([
    body.quoteId,
    body.walletId,
    body.connectionId,
    body.network,
    body.collector.fullName,
    body.collector.email.toLowerCase(),
    body.note ?? '',
  ])
}

type CreateOrderInput = {
  id: string
  userId: string
  quote: Quote
  wallet: Wallet
  connection: WalletConnection
  collector: { fullName: string; email: string }
  note: string | null
  now: number
  scenario: Scenario
  db: MockDb
}

export function createOrderRecord(input: CreateOrderInput): OrderRecord {
  const { id, userId, quote, wallet, connection, collector, note, now, scenario, db } = input
  const cart = hydrateCart(db, `user:${userId}`, db.carts[`user:${userId}`], now)

  const items: OrderItem[] = quote.items.map((item) => {
    const cartItem = cart.items.find(
      (candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId,
    )
    return {
      nftId: item.nftId,
      editionId: item.editionId,
      name: item.name,
      tokenId: cartItem?.tokenId ?? '',
      editionLabel: item.editionLabel,
      imageUrl: cartItem?.image.url ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }
  })

  const timestamp = new Date(now).toISOString()

  return {
    id,
    userId,
    status: 'pending',
    network: quote.network,
    walletLabel: wallet.label,
    walletProvider: connection.provider,
    walletAddress: wallet.address,
    collector,
    note,
    items,
    couponCode: quote.couponCode,
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    transactionHash: null,
    explorerUrl: null,
    declineReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    settleAt: new Date(now + scenario.payment.settleMs).toISOString(),
    outcome: scenario.payment.outcome,
  }
}

function removePurchasedFromCart(db: MockDb, order: OrderRecord) {
  const key = `user:${order.userId}`
  const cart = db.carts[key]
  if (!cart) return

  const lines: CartLineRecord[] = cart.lines.flatMap((line) => {
    const bought = order.items.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    if (!bought) return [line]
    const remaining = line.quantity - bought.quantity
    return remaining > 0 ? [{ ...line, quantity: remaining }] : []
  })

  db.carts[key] = {
    lines,
    couponCode: lines.length === 0 ? null : cart.couponCode,
    version: cart.version + 1,
  }
}

function decrementStock(db: MockDb, order: OrderRecord) {
  for (const item of order.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (!nft || !edition) continue

    edition.available = Math.max(0, edition.available - item.quantity)
    nft.available = nft.editions.reduce((total, current) => total + current.available, 0)
    nft.version += 1
  }
}

export function settleOrder(db: MockDb, order: OrderRecord, now: number): boolean {
  if (order.status !== 'pending' || now < Date.parse(order.settleAt)) {
    return false
  }

  const status: OrderStatus = order.outcome
  order.status = status
  order.updatedAt = new Date(now).toISOString()
  order.version += 1

  if (status === 'confirmed') {
    const hash = transactionHashFor(order.id)
    order.transactionHash = hash
    order.explorerUrl = explorerUrlFor(order.network, hash)
    decrementStock(db, order)
    removePurchasedFromCart(db, order)
  } else {
    order.declineReason = DECLINE_REASON
  }

  return true
}

export function toOrder(record: OrderRecord): Order {
  return orderSchema.parse(record)
}
