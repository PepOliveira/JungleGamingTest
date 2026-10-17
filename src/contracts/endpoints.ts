export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

const segment = (value: string) => encodeURIComponent(value)

export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    session: '/auth/session',
  },
  nfts: {
    list: '/nfts',
    featured: '/nfts/featured',
    detail: (id: string) => `/nfts/${segment(id)}`,
    related: (id: string) => `/nfts/${segment(id)}/related`,
  },
  favorites: {
    list: '/favorites',
    item: (nftId: string) => `/favorites/${segment(nftId)}`,
  },
  cart: {
    root: '/cart',
    items: '/cart/items',
    item: (itemId: string) => `/cart/items/${segment(itemId)}`,
    merge: '/cart/merge',
    coupon: '/cart/coupon',
  },
  quotes: {
    create: '/quotes',
  },
  orders: {
    list: '/orders',
    create: '/orders',
    detail: (id: string) => `/orders/${segment(id)}`,
  },
  profile: {
    root: '/profile',
    avatar: '/profile/avatar',
    password: '/profile/password',
  },
  wallets: {
    list: '/wallets',
    create: '/wallets',
    detail: (id: string) => `/wallets/${segment(id)}`,
  },
} as const
