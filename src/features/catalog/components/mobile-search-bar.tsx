import { SlidersHorizontal } from 'lucide-react'
import { useCatalogFilters } from '../use-catalog-filters'
import { FiltersSheet } from './filters-sheet'
import { SearchField } from './search-field'

export function MobileSearchBar() {
  const { search, update } = useCatalogFilters()

  return (
    <div className="mb-5 flex items-center gap-3 pt-5 md:hidden">
      <SearchField
        className="flex-1"
        value={search.q ?? ''}
        label="Buscar NFTs"
        placeholder="Explorar coleções"
        onCommit={(q) => void update({ q: q || undefined }, { replace: true })}
      />
      <FiltersSheet
        trigger={
          <button
            type="button"
            aria-label="Abrir filtros"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#8c5c34] to-[#c38147] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}
