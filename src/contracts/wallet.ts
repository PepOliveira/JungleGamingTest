import { z } from 'zod'
import { idSchema, networkSchema } from './common'

export const walletKindSchema = z.enum(['primary', 'secondary'])
export type WalletKind = z.infer<typeof walletKindSchema>

export const walletSchema = z.object({
  id: idSchema,
  label: z.string(),
  address: z.string().min(1),
  network: networkSchema,
  kind: walletKindSchema,
})
export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})
export type WalletsResponse = z.infer<typeof walletsResponseSchema>

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/
const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidWalletAddress(network: z.infer<typeof networkSchema>, address: string) {
  const pattern = network === 'solana' ? solanaAddressPattern : evmAddressPattern
  return pattern.test(address)
}

export const createWalletRequestSchema = z
  .object({
    label: z.string().trim().min(2).max(40),
    address: z.string().trim(),
    network: networkSchema,
    kind: walletKindSchema,
  })
  .refine((wallet) => isValidWalletAddress(wallet.network, wallet.address), {
    path: ['address'],
    message: 'Endereço inválido para a rede selecionada',
  })
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = createWalletRequestSchema
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>
