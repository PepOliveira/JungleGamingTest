import { authHandlers } from './auth'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'

export const handlers = [...authHandlers, ...favoriteHandlers, ...nftHandlers]
