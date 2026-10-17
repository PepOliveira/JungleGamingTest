import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MOCK_SOCKET_URL } from '@/contracts/realtime'
import { getDb, resetDb, updateDb } from '../db/store'
import { server } from '../server'
import { realtimeControls } from './controls'
import { settleDueOrders } from './settlement'

type Probe = {
  socket: WebSocket
  frames: string[]
  waitFor: (predicate: (frame: string) => boolean) => Promise<string>
  close: () => void
}

const open: Probe[] = []

function connect(auth: Record<string, unknown> = {}): Probe {
  const socket = new WebSocket(`${MOCK_SOCKET_URL}/socket.io/?EIO=4&transport=websocket`)
  const frames: string[] = []
  const waiters: Array<{ predicate: (frame: string) => boolean; resolve: (f: string) => void }> = []

  socket.addEventListener('message', (event) => {
    const frame = String(event.data)
    if (frame.startsWith('0{')) {
      socket.send(`40${JSON.stringify(auth)}`)
      return
    }
    frames.push(frame)
    waiters.forEach((waiter, index) => {
      if (waiter.predicate(frame)) {
        waiters.splice(index, 1)
        waiter.resolve(frame)
      }
    })
  })

  const probe: Probe = {
    socket,
    frames,
    waitFor: (predicate) => {
      const existing = frames.find(predicate)
      if (existing) return Promise.resolve(existing)
      return new Promise((resolve) => waiters.push({ predicate, resolve }))
    },
    close: () => socket.close(),
  }
  open.push(probe)
  return probe
}

const isConnected = (frame: string) => frame.startsWith('40{')
const eventsNamed = (probe: Probe, name: string) =>
  probe.frames.filter((frame) => frame.startsWith(`42["${name}"`))

function tick(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }))
afterAll(() => server.close())
beforeEach(() => {
  resetDb()
  updateDb((db) => {
    db.sessions.token_marina = {
      userId: db.users[0]!.id,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    }
  })
})
afterEach(() => {
  realtimeControls.goOnline()
  open.splice(0).forEach((probe) => probe.close())
})

describe('socket handshake', () => {
  it('accepts guests and authenticated users', async () => {
    const guest = connect()
    const member = connect({ token: 'token_marina' })

    expect(await guest.waitFor(isConnected)).toMatch(/^40\{"sid":"/)
    expect(await member.waitFor(isConnected)).toMatch(/^40\{"sid":"/)
  })

  it('rejects an invalid token with a connect error', async () => {
    const probe = connect({ token: 'forged' })

    expect(await probe.waitFor((frame) => frame.startsWith('44'))).toBe(
      '44{"message":"unauthorized"}',
    )
  })
})

describe('event delivery', () => {
  it('broadcasts nft updates with a new version to every client', async () => {
    const guest = connect()
    const member = connect({ token: 'token_marina' })
    await guest.waitFor(isConnected)
    await member.waitFor(isConnected)
    const nft = getDb().nfts[0]!
    const previousVersion = nft.version

    realtimeControls.emitNftUpdate(nft.id, { price: '1.25' })
    await tick()

    for (const probe of [guest, member]) {
      const [frame] = eventsNamed(probe, 'nft.updated')
      const event = JSON.parse(frame!.slice(2))[1]
      expect(event.resource.id).toBe(nft.id)
      expect(event.data.price).toBe('1.25')
      expect(event.version).toBe(previousVersion + 1)
    }
  })

  it('keeps the same event id when an event is replayed', async () => {
    const probe = connect()
    await probe.waitFor(isConnected)

    realtimeControls.emitNftUpdate(getDb().nfts[0]!.id, { price: '1.25' })
    realtimeControls.replayLastEvent()
    await tick()

    const ids = eventsNamed(probe, 'nft.updated').map(
      (frame) => JSON.parse(frame.slice(2))[1].eventId,
    )
    expect(ids).toHaveLength(2)
    expect(ids[0]).toBe(ids[1])
  })

  it('sends order updates only to the owner when an order settles', async () => {
    const owner = connect({ token: 'token_marina' })
    const other = connect()
    await owner.waitFor(isConnected)
    await other.waitFor(isConnected)
    const nft = getDb().nfts[0]!
    updateDb((db) => {
      db.orders.push({
        id: 'order_test',
        userId: db.users[0]!.id,
        status: 'pending',
        network: 'ethereum',
        walletLabel: 'Principal',
        walletProvider: 'metamask',
        walletAddress: '0xabc',
        collector: { fullName: 'Marina', email: 'marina@kurio.dev' },
        note: null,
        items: [
          {
            nftId: nft.id,
            editionId: nft.defaultEditionId,
            name: nft.name,
            tokenId: nft.tokenId,
            editionLabel: '1/1',
            imageUrl: '',
            quantity: 1,
            unitPrice: nft.price,
            lineTotal: nft.price,
          },
        ],
        couponCode: null,
        subtotal: nft.price,
        discount: '0',
        networkFee: '0.016',
        total: nft.price,
        transactionHash: null,
        explorerUrl: null,
        declineReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        settleAt: new Date(Date.now() - 1000).toISOString(),
        outcome: 'confirmed',
      })
    })

    expect(settleDueOrders()).toBe(1)
    await tick()

    expect(eventsNamed(owner, 'order.updated')).toHaveLength(1)
    expect(eventsNamed(other, 'order.updated')).toHaveLength(0)
    expect(eventsNamed(other, 'nft.updated')).toHaveLength(1)
    const order = JSON.parse(eventsNamed(owner, 'order.updated')[0]!.slice(2))[1]
    expect(order.data.status).toBe('confirmed')
    expect(order.data.transactionHash).toMatch(/^0x/)
  })
})

describe('connection control', () => {
  it('closes sockets on disconnect and refuses new ones while offline', async () => {
    const probe = connect()
    await probe.waitFor(isConnected)

    const closed = new Promise((resolve) => probe.socket.addEventListener('close', resolve))
    realtimeControls.goOffline()
    await closed

    const refused = connect()
    const refusedClose = new Promise((resolve) => refused.socket.addEventListener('close', resolve))
    await refusedClose
    expect(refused.frames.some(isConnected)).toBe(false)
  })
})
