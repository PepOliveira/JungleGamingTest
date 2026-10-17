import { describe, expect, it } from 'vitest'
import {
  ethAdd,
  ethCompare,
  ethEquals,
  ethIsZero,
  ethMultiply,
  ethFromCents,
  ethSub,
  ethToCents,
  ethSum,
  formatEth,
  formatEthWithSymbol,
  parseEthInput,
} from './eth'

describe('eth arithmetic', () => {
  it('adds without floating point drift', () => {
    expect(ethAdd('0.1', '0.2')).toBe('0.3')
  })

  it('keeps 18 decimal places', () => {
    expect(ethAdd('0.000000000000000001', '0.000000000000000002')).toBe('0.000000000000000003')
  })

  it('subtracts amounts', () => {
    expect(ethSub('1.19', '0.19')).toBe('1')
  })

  it('multiplies by integer quantities', () => {
    expect(ethMultiply('1.19', 3)).toBe('3.57')
    expect(ethMultiply('0.000000000000000001', 5)).toBe('0.000000000000000005')
  })

  it('rejects non integer quantities', () => {
    expect(() => ethMultiply('1', 1.5)).toThrow(RangeError)
    expect(() => ethMultiply('1', -1)).toThrow(RangeError)
  })

  it('sums a list of amounts', () => {
    expect(ethSum(['0.1', '0.2', '0.3'])).toBe('0.6')
    expect(ethSum([])).toBe('0')
  })

  it('compares amounts numerically, not lexically', () => {
    expect(ethCompare('10', '9.99')).toBe(1)
    expect(ethCompare('1.10', '1.1')).toBe(0)
    expect(ethCompare('0.5', '0.50001')).toBe(-1)
    expect(ethEquals('2', '2.000')).toBe(true)
    expect(ethIsZero('0.0')).toBe(true)
  })
})

describe('eth formatting', () => {
  it('uses at least two fraction digits', () => {
    expect(formatEth('1')).toBe('1.00')
    expect(formatEth('1.5')).toBe('1.50')
    expect(formatEth('1.19')).toBe('1.19')
  })

  it('preserves full precision without trailing zeros', () => {
    expect(formatEth('0.123456789012345678')).toBe('0.123456789012345678')
    expect(formatEth('0.100000000000000000')).toBe('0.10')
  })

  it('appends the symbol', () => {
    expect(formatEthWithSymbol('1.19')).toBe('1.19 ETH')
  })
})

describe('eth input parsing', () => {
  it('accepts dot and comma decimals', () => {
    expect(parseEthInput('1,5')).toBe('1.5')
    expect(parseEthInput(' 0.02 ')).toBe('0.02')
  })

  it('rejects invalid values', () => {
    expect(parseEthInput('abc')).toBeNull()
    expect(parseEthInput('-1')).toBeNull()
    expect(parseEthInput('1.0000000000000000001')).toBeNull()
    expect(parseEthInput('')).toBeNull()
  })
})

describe('eth cents conversion', () => {
  it('converts amounts to integer cents', () => {
    expect(ethToCents('0.02')).toBe(2)
    expect(ethToCents('12.30')).toBe(1230)
    expect(ethToCents('1.999')).toBe(199)
  })

  it('converts cents back to amounts', () => {
    expect(ethFromCents(2)).toBe('0.02')
    expect(ethFromCents(1230)).toBe('12.3')
    expect(() => ethFromCents(1.5)).toThrow(RangeError)
  })
})
