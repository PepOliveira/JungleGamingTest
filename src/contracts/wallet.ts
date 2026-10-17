import { z } from 'zod'
import { ensNameSchema } from './auth'
import { idSchema, networkSchema } from './common'

export const walletKindSchema = z.enum(['primary', 'secondary'])
export type WalletKind = z.infer<typeof walletKindSchema>

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'], {
  error: 'Selecione o tipo de carteira',
})
export type WalletProvider = z.infer<typeof walletProviderSchema>

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/
const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidWalletAddress(network: z.infer<typeof networkSchema>, address: string) {
  const pattern = network === 'solana' ? solanaAddressPattern : evmAddressPattern
  return pattern.test(address)
}

const walletFields = {
  label: z
    .string()
    .trim()
    .min(2, 'O apelido deve ter ao menos 2 caracteres')
    .max(40, 'O apelido deve ter até 40 caracteres'),
  holderName: z
    .string()
    .trim()
    .min(2, 'O nome de exibição deve ter ao menos 2 caracteres')
    .max(80, 'O nome de exibição deve ter até 80 caracteres'),
  profileName: z
    .string()
    .trim()
    .min(2, 'O nome do perfil deve ter ao menos 2 caracteres')
    .max(80, 'O nome do perfil deve ter até 80 caracteres'),
  network: networkSchema,
  address: z.string().trim(),
  alias: z
    .string()
    .trim()
    .max(80, 'Use até 80 caracteres')
    .nullable()
    .transform((value) => value || null),
  provider: walletProviderSchema,
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,20}$/, 'Use de 4 a 20 letras, números ou hífen'),
  contactEmail: z.email('Informe um e-mail válido'),
  ensName: ensNameSchema,
}

function withAddressValidation<TShape extends z.ZodRawShape>(shape: TShape) {
  return z.object(shape).superRefine((wallet, context) => {
    const { network, address } = wallet as unknown as {
      network: 'ethereum' | 'polygon' | 'solana'
      address: string
    }
    if (!isValidWalletAddress(network, address)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Endereço inválido para a rede selecionada',
      })
    }
  })
}

export const createWalletRequestSchema = withAddressValidation({
  ...walletFields,
  kind: walletKindSchema,
})
export type CreateWalletRequest = z.input<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = createWalletRequestSchema
export type UpdateWalletRequest = CreateWalletRequest

export const walletSchema = z.object({
  id: idSchema,
  kind: walletKindSchema,
  label: z.string(),
  holderName: z.string(),
  profileName: z.string(),
  network: networkSchema,
  address: z.string().min(1),
  alias: z.string().nullable(),
  provider: walletProviderSchema,
  referralCode: z.string(),
  contactEmail: z.email(),
  ensName: ensNameSchema,
})
export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})
export type WalletsResponse = z.infer<typeof walletsResponseSchema>
