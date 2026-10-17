import { env } from '@/shared/config/env'

export function apiUrl(path: string) {
  return `${env.VITE_API_BASE_URL}${path}`
}
