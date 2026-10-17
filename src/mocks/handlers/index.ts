import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quotes'
import { walletConnectionHandlers } from './wallet-connections'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...nftHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...quoteHandlers,
  ...walletConnectionHandlers,
  ...walletHandlers,
]
