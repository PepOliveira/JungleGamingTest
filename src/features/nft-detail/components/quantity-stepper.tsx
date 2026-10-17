import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/shared/lib/utils'

type QuantityStepperProps = {
  value: number
  max: number
  disabled?: boolean
  showLabel?: boolean
  onChange: (quantity: number) => void
}

const buttonClass =
  'flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40'

export function QuantityStepper({
  value,
  max,
  disabled = false,
  showLabel = false,
  onChange,
}: QuantityStepperProps) {
  const inputId = useId()
  const hintId = useId()
  const atLimit = !disabled && value >= max

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className={cn('text-sm font-bold text-muted-foreground', !showLabel && 'sr-only')}
        >
          Qtd.
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || value <= 1}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4" aria-hidden="true" />
          <span className="sr-only">Diminuir quantidade</span>
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          value={disabled ? '' : value}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            if (Number.isInteger(next)) {
              onChange(next)
            }
          }}
          className="h-8 w-10 rounded-md bg-transparent text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="sr-only">Aumentar quantidade</span>
        </button>
      </div>
      <p id={hintId} role="status" className="min-h-4 text-xs text-muted-foreground">
        {disabled
          ? 'Sem unidades disponíveis.'
          : atLimit
            ? `Limite de ${max} ${max === 1 ? 'unidade' : 'unidades'} para esta edição.`
            : ''}
      </p>
    </div>
  )
}
