import { Link, useRouterState } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import type { ReactNode } from 'react'
import { primaryNavigation } from '@/shared/config/navigation'
import { cn } from '@/shared/lib/utils'
import { Logo } from './logo'
import { UnavailableLink } from './unavailable-link'

type SiteHeaderProps = {
  cartCount: number
  searchSlot: ReactNode
  accountSlot: ReactNode
}

const navLinkClass =
  '-mb-px flex h-full items-center border-b-2 border-transparent px-1 text-sm font-medium text-foreground/85 transition-colors hover:text-primary'

const navLinkActiveClass = 'border-primary text-primary'

export function SiteHeader({ cartCount, searchSlot, accountSlot }: SiteHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const onMarketPage =
    pathname.startsWith('/nfts/') || pathname === '/carrinho' || pathname === '/pagamento'

  return (
    <header className="hidden border-b border-border md:block">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-6">
        <Logo />
        <nav aria-label="Principal" className="flex h-full items-center gap-10">
          <Link
            to="/"
            activeOptions={{ exact: true, includeSearch: false }}
            activeProps={{ className: navLinkActiveClass }}
            className={navLinkClass}
          >
            Início
          </Link>
          {primaryNavigation.map((item) => (
            <UnavailableLink
              key={item.secao}
              secao={item.secao}
              activeProps={{ className: navLinkActiveClass }}
              className={cn(
                navLinkClass,
                item.secao === 'mercado' && onMarketPage && navLinkActiveClass,
              )}
            >
              {item.label}
            </UnavailableLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {searchSlot}
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'unidade' : 'unidades'}`}
            className="relative rounded-sm p-1 text-foreground transition-colors hover:text-primary"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-bold text-primary-foreground"
            >
              {cartCount}
            </span>
          </Link>
          {accountSlot}
        </div>
      </div>
    </header>
  )
}
