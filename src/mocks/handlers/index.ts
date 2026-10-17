import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...nftHandlers,
  ...profileHandlers,
  ...walletHandlers,
]
