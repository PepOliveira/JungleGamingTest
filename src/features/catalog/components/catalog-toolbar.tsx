import { SlidersHorizontal } from 'lucide-react'
import { nftSortSchema, nftTabSchema } from '@/contracts/nft'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { sortLabels, tabLabels } from '../labels'
import { useCatalogFilters } from '../use-catalog-filters'
import { FiltersSheet } from './filters-sheet'

export function CatalogToolbar() {
  const { search, update } = useCatalogFilters()

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 md:border-b md:border-border">
      <nav aria-label="Categorias do catálogo" className="-mb-px flex gap-5 overflow-x-auto">
        {nftTabSchema.options.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={search.tab === tab}
            onClick={() => void update({ tab })}
            className={cn(
              'border-b-2 border-transparent py-3 text-sm whitespace-nowrap text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring',
              search.tab === tab && 'border-primary font-medium text-primary',
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>
      <div className="hidden items-center gap-2 pb-2 md:flex">
        <FiltersSheet
          trigger={
            <Button variant="outline" size="lg" className="lg:hidden">
              <SlidersHorizontal aria-hidden="true" />
              Filtros
            </Button>
          }
        />
        <span id="sort-label" className="text-sm text-muted-foreground">
          Ordenar por:
        </span>
        <Select
          value={search.sort}
          onValueChange={(value) => {
            const parsed = nftSortSchema.safeParse(value)
            if (parsed.success) {
              void update({ sort: parsed.data })
            }
          }}
        >
          <SelectTrigger aria-labelledby="sort-label" className="px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {nftSortSchema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {sortLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
