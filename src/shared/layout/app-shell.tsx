import { Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { MobileTabBar } from './mobile-tab-bar'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

type AppShellProps = {
  headerSearch: ReactNode
}

export function AppShell({ headerSearch }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hideTabBar = pathname.startsWith('/nfts/')

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader cartCount={0} searchSlot={headerSearch} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      {hideTabBar ? null : <MobileTabBar />}
    </div>
  )
}
