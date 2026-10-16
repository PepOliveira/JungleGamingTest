import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'
import { UnavailableLink } from './unavailable-link'

const tabClass =
  'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-muted-foreground transition-colors'
const tabActiveClass = 'text-primary'

export function MobileTabBar() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="relative flex items-stretch rounded-t-[2rem] bg-card px-4">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: tabActiveClass }}
          className={tabClass}
        >
          <Home className="size-6" aria-hidden="true" />
          <span className="sr-only">Início</span>
        </Link>
        <UnavailableLink
          secao="favoritos"
          activeProps={{ className: tabActiveClass }}
          className={tabClass}
        >
          <Heart className="size-6" aria-hidden="true" />
          <span className="sr-only">Favoritos</span>
        </UnavailableLink>
        <div className="w-20 shrink-0" aria-hidden="true" />
        <UnavailableLink
          secao="carrinho"
          activeProps={{ className: tabActiveClass }}
          className={tabClass}
        >
          <ShoppingCart className="size-6" aria-hidden="true" />
          <span className="sr-only">Carrinho</span>
        </UnavailableLink>
        <UnavailableLink
          secao="perfil"
          activeProps={{ className: tabActiveClass }}
          className={tabClass}
        >
          <User className="size-6" aria-hidden="true" />
          <span className="sr-only">Perfil</span>
        </UnavailableLink>
        <UnavailableLink
          secao="escanear"
          aria-label="Escanear código"
          className="absolute -top-8 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#8c5c34] to-[#c38147] text-foreground ring-8 ring-background"
        >
          <ScanLine className="size-7" aria-hidden="true" />
        </UnavailableLink>
      </div>
    </nav>
  )
}
