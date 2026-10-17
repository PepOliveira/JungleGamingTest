import { afterEach, describe, expect, it } from 'vitest'
import { checkoutFingerprint, clearAttempt, getAttemptKey } from './checkout-attempt'

afterEach(() => {
  clearAttempt()
})

const parts = {
  quoteId: 'quote_1',
  walletId: 'wallet_1',
  connectionId: 'conn_1',
  fullName: 'Marina Duarte',
  email: 'M@kurio.dev',
  note: '',
}

describe('getAttemptKey', () => {
  it('returns the same key for the same checkout content (retries and double clicks)', () => {
    const fingerprint = checkoutFingerprint(parts)
    expect(getAttemptKey(fingerprint)).toBe(getAttemptKey(fingerprint))
  })

  it('creates a new key when the content changes', () => {
    const first = getAttemptKey(checkoutFingerprint(parts))
    const second = getAttemptKey(checkoutFingerprint({ ...parts, quoteId: 'quote_2' }))
    expect(second).not.toBe(first)
    expect(second).toMatch(/^idem_[0-9a-f]{32}$/)
  })

  it('creates a new key after clearing the attempt', () => {
    const fingerprint = checkoutFingerprint(parts)
    const first = getAttemptKey(fingerprint)
    clearAttempt()
    expect(getAttemptKey(fingerprint)).not.toBe(first)
  })
})

describe('checkoutFingerprint', () => {
  it('ignores the case of the e-mail', () => {
    expect(checkoutFingerprint(parts)).toBe(checkoutFingerprint({ ...parts, email: 'm@KURIO.dev' }))
  })
})
