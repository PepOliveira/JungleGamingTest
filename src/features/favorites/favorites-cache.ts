import type { FavoritesResponse } from '@/contracts/favorites'
import type { NftSummary } from '@/contracts/nft'

export function pickSummary(nft: NftSummary): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    price: nft.price,
    originalPrice: nft.originalPrice,
    rarity: nft.rarity,
    collection: nft.collection,
    network: nft.network,
    available: nft.available,
    version: nft.version,
  }
}

export function applyFavoriteChange(
  current: FavoritesResponse | undefined,
  nft: NftSummary,
  favorite: boolean,
): FavoritesResponse {
  const items = current?.items ?? []
  const exists = items.some((item) => item.id === nft.id)

  if (favorite) {
    return exists ? { items } : { items: [...items, pickSummary(nft)] }
  }
  return { items: items.filter((item) => item.id !== nft.id) }
}
