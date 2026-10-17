import { endpoints } from '@/contracts/endpoints'
import { walletSchema, walletsResponseSchema } from '@/contracts/wallet'
import type { CreateWalletRequest } from '@/contracts/wallet'
import { apiRequest } from '@/shared/api/request'

export function fetchWallets(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.wallets.list, signal }, walletsResponseSchema)
}

export function createWallet(body: CreateWalletRequest) {
  return apiRequest({ method: 'POST', url: endpoints.wallets.create, data: body }, walletSchema)
}

export function updateWallet(id: string, body: CreateWalletRequest) {
  return apiRequest({ method: 'PUT', url: endpoints.wallets.detail(id), data: body }, walletSchema)
}
