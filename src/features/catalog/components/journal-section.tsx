import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { journalArticles } from '../content'

export function JournalSection() {
  return (
    <section aria-labelledby="journal-title" className="mt-20">
      <div className="mb-8 text-center">
        <h2 id="journal-title" className="text-2xl font-bold">
          Diário da Cunhagem
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {journalArticles.map((article) => (
          <li key={article.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-xl bg-card">
              <div className="aspect-[4/3] overflow-hidden bg-canvas">
                <ResponsiveImage
                  image={article.image}
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                  className="object-top"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[10px] text-muted-foreground">
                  {article.date} <span aria-hidden="true">|</span> {article.readTime}
                </p>
                <h3 className="text-sm font-bold">{article.title}</h3>
                <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <UnavailableLink
                  secao={`diario-${article.id}`}
                  aria-label={`Ler mais: ${article.title}`}
                  className="w-fit rounded-sm text-[11px] font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ler mais →
                </UnavailableLink>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
