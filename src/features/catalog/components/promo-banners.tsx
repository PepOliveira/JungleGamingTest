import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { promoBanners } from '../content'

export function PromoBanners() {
  return (
    <section aria-label="Destaques da Kurio" className="mt-20 grid gap-6 lg:grid-cols-2">
      {promoBanners.map((banner) => (
        <article
          key={banner.id}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-xl bg-card"
        >
          <div className="aspect-square max-h-72 bg-canvas sm:aspect-auto">
            <ResponsiveImage
              image={banner.image}
              sizes="(min-width: 1024px) 220px, 30vw"
              className="object-top"
            />
          </div>
          <div className="flex flex-col items-end justify-center gap-3 p-4 text-right sm:p-6">
            <h3 className="text-sm font-bold">{banner.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{banner.description}</p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/" search={banner.search} hash="catalogo">
                Explorar
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
