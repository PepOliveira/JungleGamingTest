import { CatalogResults } from './catalog-results'
import { CatalogToolbar } from './catalog-toolbar'
import { FeaturedCard } from './featured-card'
import { FiltersPanel } from './filters-panel'
import { Hero } from './hero'
import { JournalSection } from './journal-section'
import { MobileSearchBar } from './mobile-search-bar'
import { PromoBanners } from './promo-banners'

export function CatalogPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-8 md:px-6 md:pt-8">
      <MobileSearchBar />
      <Hero />
      <div id="catalogo" className="grid scroll-mt-6 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Filtros" className="hidden flex-col gap-6 lg:flex">
          <div className="rounded-xl bg-card p-5">
            <FiltersPanel />
          </div>
          <FeaturedCard />
        </aside>
        <section aria-labelledby="catalog-title" className="min-w-0">
          <h2 id="catalog-title" className="sr-only">
            Catálogo de NFTs
          </h2>
          <CatalogToolbar />
          <CatalogResults />
        </section>
      </div>
      <PromoBanners />
      <JournalSection />
    </div>
  )
}
