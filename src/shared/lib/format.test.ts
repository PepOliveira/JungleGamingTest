import { describe, expect, it } from 'vitest'
import { formatReceiptDate, shortenMiddle } from './format'

describe('shortenMiddle', () => {
  it('keeps the start and the end of long values', () => {
    expect(shortenMiddle('0xA91F000000000000000000000000000000E82C')).toBe('0xA91F…E82C')
  })

  it('returns short values untouched', () => {
    expect(shortenMiddle('0xA91F')).toBe('0xA91F')
  })
})

describe('formatReceiptDate', () => {
  it('formats the date as shown in the design', () => {
    expect(formatReceiptDate('2026-07-29T14:20:00.000Z')).toBe('29 Jul, 2026')
    expect(formatReceiptDate('2026-01-05T00:30:00.000Z')).toBe('05 Jan, 2026')
  })
})
