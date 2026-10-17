import { Link, Outlet, useRouter } from '@tanstack/react-router'
import {
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  Tag,
  TriangleAlert,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLogout } from '@/features/auth/use-auth-mutations'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { cn } from '@/shared/lib/utils'

type NavItem =
  | {
      kind: 'page'
      to: '/perfil' | '/perfil/carteiras'
      label: string
      icon: LucideIcon
      exact?: boolean
    }
  | { kind: 'unavailable'; secao: string; label: string; icon: LucideIcon }

const items: readonly NavItem[] = [
  { kind: 'page', to: '/perfil', label: 'Dados do perfil', icon: User, exact: true },
  { kind: 'page', to: '/perfil/carteiras', label: 'Carteiras', icon: MapPin },
  { kind: 'unavailable', secao: 'atividade', label: 'Atividade', icon: ShoppingCart },
  { kind: 'unavailable', secao: 'lista-de-interesse', label: 'Lista de interesse', icon: Heart },
  { kind: 'unavailable', secao: 'ofertas', label: 'Ofertas', icon: Tag },
  { kind: 'unavailable', secao: 'arquivos-baixados', label: 'Arquivos baixados', icon: Download },
  { kind: 'unavailable', secao: 'suporte', label: 'Suporte', icon: TriangleAlert },
]

const itemClass =
  'flex items-center gap-3 rounded-sm border-l-4 border-transparent px-3 py-2.5 text-sm text-primary-bright outline-none transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring max-lg:shrink-0 max-lg:rounded-full max-lg:border max-lg:border-border max-lg:px-4 max-lg:py-2 max-lg:whitespace-nowrap'
const activeClass =
  'border-primary bg-secondary/40 lg:border-l-primary max-lg:border-primary max-lg:bg-primary/15'

export function AccountLayout() {
  const router = useRouter()
  const logout = useLogout()

  async function handleLogout() {
    await logout.mutateAsync()
    await router.navigate({ to: '/' })
  }

  return (
    <div className="mx-auto grid w-full max-w-[1248px] grid-cols-1 gap-6 px-4 py-6 pb-32 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7 lg:px-6 lg:pt-8 lg:pb-16">
      <nav
        aria-label="Menu da conta"
        className="min-w-0 lg:self-start lg:rounded-lg lg:bg-card lg:py-2"
      >
        <h2 className="hidden px-4 pt-3 pb-2 text-lg font-bold lg:block">Meu perfil</h2>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0">
          {items.map((item) => (
            <li key={item.label}>
              {item.kind === 'page' ? (
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
                  activeProps={{ className: activeClass, 'aria-current': 'page' }}
                  className={itemClass}
                >
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  {item.label}
                </Link>
              ) : (
                <UnavailableLink secao={item.secao} className={itemClass}>
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  {item.label}
                </UnavailableLink>
              )}
            </li>
          ))}
          <li className="lg:mt-1 lg:border-t lg:border-[#4f3321] lg:pt-1">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={handleLogout}
              className={cn(itemClass, 'w-full font-bold')}
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
