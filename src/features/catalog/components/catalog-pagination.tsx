import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { getPageItems } from '../page-items'

type CatalogPaginationProps = {
  page: number
  totalPages: number
}

const itemClass =
  'flex size-9 items-center justify-center rounded-md border border-border text-sm transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Paginação do catálogo" className="mt-10 flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 ? (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page - 1 })}
              resetScroll={false}
              aria-label="Página anterior"
              className={itemClass}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
          </li>
        ) : null}
        {getPageItems(page, totalPages).map((item) =>
          item.type === 'gap' ? (
            <li key={item.key} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item.page}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, page: item.page })}
                resetScroll={false}
                aria-label={`Página ${item.page}`}
                aria-current={item.page === page ? 'page' : undefined}
                className={cn(
                  itemClass,
                  item.page === page &&
                    'border-primary bg-primary font-bold text-primary-foreground',
                )}
              >
                {item.page}
              </Link>
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page + 1 })}
              resetScroll={false}
              aria-label="Próxima página"
              className={itemClass}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
