import { hashPassword } from '../utils/password'
import type { UserRecord } from '../db/types'

export const demoCredentials = [
  { email: 'colecionador@kurio.dev', password: 'Kurio@123' },
  { email: 'criadora@kurio.dev', password: 'Kurio@456' },
] as const

export function createUsers(): UserRecord[] {
  const [first, second] = demoCredentials
  return [
    {
      id: 'user_marina',
      name: 'Marina Duarte',
      email: first.email,
      avatarUrl: null,
      createdAt: '2026-08-02T14:20:00.000Z',
      passwordSalt: 'salt_marina',
      passwordHash: hashPassword(first.password, 'salt_marina'),
    },
    {
      id: 'user_rafael',
      name: 'Rafael Lima',
      email: second.email,
      avatarUrl: null,
      createdAt: '2026-08-19T09:05:00.000Z',
      passwordSalt: 'salt_rafael',
      passwordHash: hashPassword(second.password, 'salt_rafael'),
    },
  ]
}
