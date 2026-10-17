import { describe, expect, it } from 'vitest'
import { createEventLedger } from './event-ledger'

describe('createEventLedger', () => {
  it('reports an id as seen only after its first occurrence', () => {
    const ledger = createEventLedger()

    expect(ledger.seen('evt_1')).toBe(false)
    expect(ledger.seen('evt_1')).toBe(true)
    expect(ledger.seen('evt_2')).toBe(false)
  })

  it('forgets the oldest ids once capacity is exceeded', () => {
    const ledger = createEventLedger(2)

    ledger.seen('a')
    ledger.seen('b')
    ledger.seen('c')

    expect(ledger.seen('a')).toBe(false)
    expect(ledger.seen('c')).toBe(true)
  })

  it('clears every remembered id', () => {
    const ledger = createEventLedger()
    ledger.seen('a')

    ledger.clear()

    expect(ledger.seen('a')).toBe(false)
  })
})
