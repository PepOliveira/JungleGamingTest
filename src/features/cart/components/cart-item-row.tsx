import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { CartItem } from '@/contracts/cart'
import { formatEthWithSymbol } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { useRemoveCartItem, useUpdateCartItem } from '../use-cart'
import { CartQuantity } from './cart-quantity'

type CartItemRowProps = {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const pending = update.isPending || remove.isPending

  const soldOut = item.available === 0
  const exceeds = !soldOut && item.quantity > item.available

  const thumbnail = (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: item.nftId }}
      aria-label={`Ver ${item.name}`}
      className="block aspect-square overflow-hidden rounded-lg bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ResponsiveImage image={item.image} sizes="84px" />
    </Link>
  )

  const quantity = (
    <CartQuantity
      itemName={item.name}
      value={item.quantity}
      available={item.available}
      pending={pending}
      onChange={(next) => update.mutate({ itemId: item.id, quantity: next })}
    />
  )

  const trash = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => remove.mutate({ itemId: item.id, label: item.name })}
      className="size-8 text-primary"
    >
      <Trash2 className="size-5" aria-hidden="true" />
      <span className="sr-only">Remover {item.name} do carrinho</span>
    </Button>
  )

  return (
    <li className="relative rounded-xl bg-card p-3 lg:rounded-lg lg:py-2">
      <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 lg:hidden">
        <div className="row-span-2 self-start">{thumbnail}</div>
        <div className="min-w-0 pr-9">
          <h3 className="truncate text-sm font-bold">{item.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Edição: {item.editionLabel}</p>
        </div>
        <div className="flex items-end justify-between gap-2 self-end">
          <p className="text-base font-bold text-primary-bright">
            <span className="sr-only">Total do item </span>
            {formatEthWithSymbol(item.lineTotal)}
          </p>
          {quantity}
        </div>
        <div className="absolute top-3 right-3">{trash}</div>
      </div>

      <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1.2fr_1fr_40px] items-center lg:grid">
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-[70px] shrink-0">{thumbnail}</div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">{item.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">ID do token: {item.tokenId}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-primary-bright">
          <span className="sr-only">Preço unitário </span>
          {formatEthWithSymbol(item.unitPrice)}
        </p>
        <div>{quantity}</div>
        <p className="text-sm font-bold text-primary-bright">
          <span className="sr-only">Total do item </span>
          {formatEthWithSymbol(item.lineTotal)}
        </p>
        <div className="justify-self-center">{trash}</div>
      </div>

      {soldOut || exceeds ? (
        <p
          role="alert"
          className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {soldOut
            ? 'Esta edição esgotou. Remova o item para continuar.'
            : `Apenas ${item.available} ${item.available === 1 ? 'unidade disponível' : 'unidades disponíveis'}. Ajuste a quantidade para continuar.`}
          {exceeds ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => update.mutate({ itemId: item.id, quantity: item.available })}
              className="ml-2 underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ajustar para {item.available}
            </button>
          ) : null}
        </p>
      ) : null}
    </li>
  )
}
