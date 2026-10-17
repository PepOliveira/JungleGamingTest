import { beforeEach, describe, expect, it } from 'vitest'
import {
  addFault,
  clearFaults,
  consumeLostOrderResponse,
  listFaults,
  loseNextOrderResponses,
  matchFault,
} from './faults'

describe('faults', () => {
  beforeEach(() => {
    clearFaults()
  })

  it('matches by path and optional method', () => {
    addFault({ method: 'GET', path: '/nfts', effect: 'status', status: 500 })

    expect(matchFault('GET', '/api/nfts/nft_001')?.status).toBe(500)
    expect(matchFault('POST', '/api/nfts')).toBeNull()
    expect(matchFault('GET', '/api/cart')).toBeNull()
  })

  it('stops matching once the configured number of hits is used', () => {
    addFault({ path: '/cart', effect: 'network', times: 2 })

    expect(matchFault('GET', '/api/cart')).not.toBeNull()
    expect(matchFault('GET', '/api/cart')).not.toBeNull()
    expect(matchFault('GET', '/api/cart')).toBeNull()
  })

  it('keeps matching forever when no limit is set', () => {
    addFault({ path: '/cart', effect: 'timeout' })

    for (let hit = 0; hit < 5; hit += 1) {
      expect(matchFault('GET', '/api/cart')).not.toBeNull()
    }
  })

  it('clears every rule', () => {
    addFault({ path: '/cart', effect: 'network' })
    loseNextOrderResponses(1)

    clearFaults()

    expect(listFaults()).toEqual([])
    expect(consumeLostOrderResponse()).toBe(false)
  })

  it('loses a limited number of order responses', () => {
    loseNextOrderResponses(2)

    expect(consumeLostOrderResponse()).toBe(true)
    expect(consumeLostOrderResponse()).toBe(true)
    expect(consumeLostOrderResponse()).toBe(false)
  })
})
