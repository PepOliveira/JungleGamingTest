import type { Wallet } from '@/contracts/wallet'

export function createWallets(): Record<string, Wallet[]> {
  return {
    user_marina: [
      {
        id: 'wallet_marina_main',
        kind: 'primary',
        label: 'Carteira principal',
        holderName: 'Marina Duarte',
        profileName: 'Marina Duarte',
        network: 'ethereum',
        address: '0x52908400098527886E0F7030069857D2E4169EE7',
        alias: null,
        provider: 'metamask',
        referralCode: 'KURIO-MARINA',
        contactEmail: 'colecionador@kurio.dev',
        ensName: { name: 'marina', suffix: '.eth' },
      },
      {
        id: 'wallet_marina_poly',
        kind: 'secondary',
        label: 'Carteira Polygon',
        holderName: 'Marina Duarte',
        profileName: 'Marina Duarte',
        network: 'polygon',
        address: '0xde709f2102306220921060314715629080e2fb77',
        alias: 'marina-poly',
        provider: 'walletconnect',
        referralCode: 'KURIO-MARINA',
        contactEmail: 'colecionador@kurio.dev',
        ensName: { name: 'marina', suffix: '.eth' },
      },
    ],
    user_rafael: [
      {
        id: 'wallet_rafael_main',
        kind: 'primary',
        label: 'Carteira principal',
        holderName: 'Rafael Lima',
        profileName: 'Rafael Lima',
        network: 'ethereum',
        address: '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
        alias: null,
        provider: 'coinbase',
        referralCode: 'KURIO-RAFAEL',
        contactEmail: 'criadora@kurio.dev',
        ensName: { name: 'rafael', suffix: '.eth' },
      },
    ],
  }
}
