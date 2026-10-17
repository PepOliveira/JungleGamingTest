import { Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { LiveRegion } from '@/shared/ui/live-region'
import { MobileTabBar } from './mobile-tab-bar'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

type AppShellProps = {
  cartCount: number
  headerSearch: ReactNode
  headerAccount: ReactNode
  mobileProfile: ReactNode
  overlays: ReactNode
}

export function AppShell({
  cartCount,
  headerSearch,
  headerAccount,
  mobileProfile,
  overlays,
}: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hideTabBar = pathname.startsWith('/nfts/') || pathname === '/carrinho'

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader cartCount={cartCount} searchSlot={headerSearch} accountSlot={headerAccount} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      {hideTabBar ? null : <MobileTabBar profileSlot={mobileProfile} />}
      {overlays}
      <LiveRegion />
    </div>
  )
}
