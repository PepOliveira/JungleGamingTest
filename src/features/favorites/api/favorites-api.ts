import { endpoints } from '@/contracts/endpoints'
import { favoritesResponseSchema } from '@/contracts/favorites'
import { apiCommand, apiRequest } from '@/shared/api/request'

export function fetchFavorites(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.favorites.list, signal }, favoritesResponseSchema)
}

export function addFavorite(nftId: string) {
  return apiCommand({ method: 'PUT', url: endpoints.favorites.item(nftId) })
}

export function removeFavorite(nftId: string) {
  return apiCommand({ method: 'DELETE', url: endpoints.favorites.item(nftId) })
}
