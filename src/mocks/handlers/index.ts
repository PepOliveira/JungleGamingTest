import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { faultHandlers } from './faults'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { socketHandlers } from '../realtime/hub'
import { quoteHandlers } from './quotes'
import { walletConnectionHandlers } from './wallet-connections'
import { walletHandlers } from './wallets'

export const handlers = [
  ...faultHandlers,
  ...authHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...nftHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...quoteHandlers,
  ...walletConnectionHandlers,
  ...walletHandlers,
  ...socketHandlers,
]
