import type { CouponRecord } from '../db/types'

export function createCoupons(): CouponRecord[] {
  return [
    { code: 'KURIO10', kind: 'percent', value: '10', expiresAt: '2030-12-31T23:59:59.000Z' },
    { code: 'BEMVINDO', kind: 'fixed', value: '0.05', expiresAt: '2030-12-31T23:59:59.000Z' },
    { code: 'EXPIRADO20', kind: 'percent', value: '20', expiresAt: '2025-01-01T00:00:00.000Z' },
  ]
}
