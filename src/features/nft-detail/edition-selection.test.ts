import { describe, expect, it } from 'vitest'
import type { Edition } from '@/contracts/nft'
import { MAX_QUANTITY_PER_ORDER, resolveSelection } from './edition-selection'

const standard: Edition = { id: 'e1', label: 'Padrão', price: '1.00', available: 40, supply: 100 }
const limited: Edition = { id: 'e2', label: 'Limitada', price: '1.50', available: 3, supply: 25 }
const soldOut: Edition = { id: 'e3', label: 'Rara', price: '3.00', available: 0, supply: 5 }

describe('resolveSelection', () => {
  it('uses the requested edition when it is available', () => {
    const selection = resolveSelection([standard, limited], 'e2', 2)
    expect(selection.edition?.id).toBe('e2')
    expect(selection.quantity).toBe(2)
    expect(selection.maxQuantity).toBe(3)
  })

  it('falls back to the first available edition for unknown or sold out ids', () => {
    expect(resolveSelection([standard, soldOut], 'e3', 1).edition?.id).toBe('e1')
    expect(resolveSelection([standard, soldOut], 'nope', 1).edition?.id).toBe('e1')
    expect(resolveSelection([soldOut, standard], undefined, 1).edition?.id).toBe('e1')
  })

  it('prefers the default edition when nothing is requested', () => {
    expect(resolveSelection([standard, limited], undefined, 1, 'e2').edition?.id).toBe('e2')
    expect(resolveSelection([standard, soldOut], undefined, 1, 'e3').edition?.id).toBe('e1')
  })

  it('caps the quantity by availability', () => {
    expect(resolveSelection([limited], 'e2', 9).quantity).toBe(3)
  })

  it('caps the quantity by the order limit', () => {
    const selection = resolveSelection([standard], 'e1', 99)
    expect(selection.maxQuantity).toBe(MAX_QUANTITY_PER_ORDER)
    expect(selection.quantity).toBe(MAX_QUANTITY_PER_ORDER)
  })

  it('never goes below one', () => {
    expect(resolveSelection([standard], 'e1', 0).quantity).toBe(1)
    expect(resolveSelection([standard], 'e1', -4).quantity).toBe(1)
    expect(resolveSelection([standard], 'e1', Number.NaN).quantity).toBe(1)
  })

  it('reports when every edition is sold out', () => {
    expect(resolveSelection([soldOut], 'e3', 1)).toEqual({
      edition: null,
      quantity: 0,
      maxQuantity: 0,
      soldOut: true,
    })
  })
})
