import { z } from 'zod'

export const ethAmountSchema = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
export type EthAmount = z.infer<typeof ethAmountSchema>

export const idSchema = z.string().min(1)
export const quantitySchema = z.number().int().min(1)
export const versionSchema = z.number().int().nonnegative()
export const isoDateSchema = z.iso.datetime({ offset: true })

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'], {
  error: 'Selecione uma rede',
})
export type Network = z.infer<typeof networkSchema>

export const imageSchema = z.object({
  url: z.string().min(1),
  alt: z.string(),
})
export type Image = z.infer<typeof imageSchema>

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
export type Pagination = z.infer<typeof paginationSchema>

export function paginated<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    pagination: paginationSchema,
  })
}
