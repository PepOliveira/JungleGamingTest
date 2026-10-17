import { Minus, Plus } from 'lucide-react'
import { MAX_QUANTITY_PER_ITEM } from '@/contracts/cart'

type CartQuantityProps = {
  itemName: string
  value: number
  available: number
  pending: boolean
  onChange: (quantity: number) => void
}

const buttonClass =
  'flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-disabled:cursor-not-allowed aria-disabled:opacity-35'

export function CartQuantity({ itemName, value, available, pending, onChange }: CartQuantityProps) {
  const max = Math.min(available, MAX_QUANTITY_PER_ITEM)

  return (
    <div role="group" aria-label={`Quantidade de ${itemName}`} className="flex items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        aria-disabled={pending || value <= 1}
        onClick={() => {
          if (!pending && value > 1) onChange(value - 1)
        }}
      >
        <Minus className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Diminuir quantidade</span>
      </button>
      <span className="w-6 text-center text-sm" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        aria-disabled={pending || value >= max}
        onClick={() => {
          if (!pending && value < max) onChange(value + 1)
        }}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Aumentar quantidade</span>
      </button>
    </div>
  )
}
