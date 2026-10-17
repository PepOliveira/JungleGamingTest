import { collectionSlugSchema, nftSortSchema } from '@/contracts/nft'
import { networkSchema } from '@/contracts/common'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { collectionLabels, networkLabels, sortLabels } from '../labels'
import { useCatalogFilters, useNftList } from '../use-catalog-filters'
import { PriceRangeFilter } from './price-range-filter'

type FacetListProps = {
  title: string
  items: readonly { key: string; label: string; count: number | undefined; selected: boolean }[]
  onToggle: (key: string) => void
}

function FacetList({ title, items, onToggle }: FacetListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              aria-pressed={item.selected}
              onClick={() => onToggle(item.key)}
              className={cn(
                'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-warm transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring',
                item.selected && 'bg-secondary font-bold text-primary',
              )}
            >
              <span>{item.label}</span>
              {item.count === undefined ? (
                <Skeleton className="h-3 w-6" />
              ) : (
                <span className="text-foreground/80">({item.count})</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type FiltersPanelProps = {
  includeSort?: boolean
}

export function FiltersPanel({ includeSort = false }: FiltersPanelProps) {
  const { search, update, toggleCollection, toggleNetwork } = useCatalogFilters()
  const list = useNftList()
  const facets = list.data?.facets

  return (
    <div className="flex flex-col gap-6">
      {includeSort ? (
        <section className="flex flex-col gap-2 md:hidden">
          <h3 id="filters-sort-label" className="text-sm font-bold">
            Ordenar por
          </h3>
          <Select
            value={search.sort}
            onValueChange={(value) => {
              const parsed = nftSortSchema.safeParse(value)
              if (parsed.success) {
                void update({ sort: parsed.data })
              }
            }}
          >
            <SelectTrigger
              aria-labelledby="filters-sort-label"
              className="h-10 justify-between border border-border bg-background px-3"
            >
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
        </section>
      ) : null}

      <FacetList
        title="Coleções"
        items={collectionSlugSchema.options.map((slug) => ({
          key: slug,
          label: collectionLabels[slug],
          count: facets?.collections[slug],
          selected: search.collections.includes(slug),
        }))}
        onToggle={(key) => {
          const parsed = collectionSlugSchema.safeParse(key)
          if (parsed.success) {
            void toggleCollection(parsed.data)
          }
        }}
      />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">Faixa de preço</h3>
        <PriceRangeFilter
          bounds={facets?.price}
          value={{ min: search.priceMin, max: search.priceMax }}
          onApply={(range) => void update(range)}
        />
      </section>

      <FacetList
        title="Rede"
        items={networkSchema.options.map((network) => ({
          key: network,
          label: networkLabels[network],
          count: facets?.networks[network],
          selected: search.networks.includes(network),
        }))}
        onToggle={(key) => {
          const parsed = networkSchema.safeParse(key)
          if (parsed.success) {
            void toggleNetwork(parsed.data)
          }
        }}
      />
    </div>
  )
}
