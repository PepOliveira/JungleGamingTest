import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'

export const handlers = [...authHandlers, ...cartHandlers, ...favoriteHandlers, ...nftHandlers]
