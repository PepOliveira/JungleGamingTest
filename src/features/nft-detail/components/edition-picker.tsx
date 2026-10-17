import { useId } from 'react'
import type { Edition } from '@/contracts/nft'
import { cn } from '@/shared/lib/utils'

type EditionPickerProps = {
  editions: readonly Edition[]
  selectedId: string | null
  onSelect: (editionId: string) => void
}

export function EditionPicker({ editions, selectedId, onSelect }: EditionPickerProps) {
  const groupName = useId()

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const inputId = `${groupName}-${edition.id}`

          return (
            <div key={edition.id} className="relative">
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={edition.id}
                checked={edition.id === selectedId}
                disabled={soldOut}
                onChange={() => onSelect(edition.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'flex cursor-pointer items-center rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:border-primary/60',
                  soldOut && 'cursor-not-allowed line-through opacity-40 hover:border-border',
                )}
              >
                {edition.label}
                <span className="sr-only">
                  {soldOut
                    ? ', esgotada'
                    : `, ${edition.available} de ${edition.supply} disponíveis`}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
