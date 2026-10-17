import { describe, expect, it } from 'vitest'
import type { Quote } from '@/contracts/quote'
import { describeQuoteChange, isQuoteExpired } from './quote-diff'

const quote = (total: string, expiresAt = '2030-01-01T00:00:00.000Z'): Quote => ({
  id: 'q',
  cartVersion: 1,
  network: 'ethereum',
  items: [],
  couponCode: null,
  subtotal: total,
  discount: '0',
  networkFee: '0',
  total,
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt,
})

describe('describeQuoteChange', () => {
  it('detects increases, decreases and equal totals numerically', () => {
    expect(describeQuoteChange(quote('9.99'), quote('10.5')).direction).toBe('up')
    expect(describeQuoteChange(quote('10.5'), quote('9.99')).direction).toBe('down')
    expect(describeQuoteChange(quote('1.10'), quote('1.1')).direction).toBe('same')
  })
})

describe('isQuoteExpired', () => {
  it('compares the expiration with the current time', () => {
    const now = Date.parse('2026-10-16T12:00:00.000Z')
    expect(isQuoteExpired(quote('1', '2026-10-16T11:59:59.000Z'), now)).toBe(true)
    expect(isQuoteExpired(quote('1', '2026-10-16T12:00:01.000Z'), now)).toBe(false)
  })
})
