import type { Wallet } from '@/contracts/wallet'

export function createWallets(): Record<string, Wallet[]> {
  return {
    user_marina: [
      {
        id: 'wallet_marina_main',
        label: 'Carteira principal',
        address: '0x52908400098527886E0F7030069857D2E4169EE7',
        network: 'ethereum',
        kind: 'primary',
      },
      {
        id: 'wallet_marina_poly',
        label: 'Carteira Polygon',
        address: '0xde709f2102306220921060314715629080e2fb77',
        network: 'polygon',
        kind: 'secondary',
      },
    ],
    user_rafael: [
      {
        id: 'wallet_rafael_main',
        label: 'Carteira principal',
        address: '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
        network: 'ethereum',
        kind: 'primary',
      },
    ],
  }
}
