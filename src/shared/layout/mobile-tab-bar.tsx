import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { UnavailableLink } from './unavailable-link'

const tabClass =
  'absolute top-[50px] flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-warm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'
const tabActiveClass = 'text-primary'

type MobileTabBarProps = {
  profileSlot: ReactNode
}

export function MobileTabBar({ profileSlot }: MobileTabBarProps) {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative h-[88px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex drop-shadow-[0_-4px_12px_rgba(0,0,0,0.45)]"
        >
          <div className="flex-1 rounded-tl-[2rem] bg-card" />
          <svg width="200" height="88" viewBox="0 0 200 88" className="shrink-0 fill-card">
            <path d="M0,0 H28 C44,0 50,6 58,16 C70,34 84,46 100,46 C116,46 130,34 142,16 C150,6 156,0 172,0 H200 V88 H0 Z" />
          </svg>
          <div className="flex-1 rounded-tr-[2rem] bg-card" />
        </div>

        <Link
          to="/"
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{ className: tabActiveClass }}
          className={cn(tabClass, 'left-[11%]')}
        >
          <Home className="size-5" fill="currentColor" aria-hidden="true" />
          <span className="sr-only">Início</span>
        </Link>
        <UnavailableLink
          secao="favoritos"
          activeProps={{ className: tabActiveClass }}
          className={cn(tabClass, 'left-[28.5%]')}
        >
          <Heart className="size-5" fill="currentColor" aria-hidden="true" />
          <span className="sr-only">Favoritos</span>
        </UnavailableLink>
        <Link
          to="/carrinho"
          activeProps={{ className: tabActiveClass }}
          className={cn(tabClass, 'left-[72.7%]')}
        >
          <ShoppingCart className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">Carrinho</span>
        </Link>
        <div className="absolute top-[50px] left-[87.7%] -translate-x-1/2 -translate-y-1/2">
          {profileSlot}
        </div>

        <UnavailableLink
          secao="escanear"
          aria-label="Escanear código"
          className="absolute top-[-26px] left-1/2 flex size-[66px] -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#eaaa72] to-[#c98b55] text-canvas shadow-[0_8px_20px_rgba(0,0,0,0.55)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ScanLine className="size-7" aria-hidden="true" />
        </UnavailableLink>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  )
}
