'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Link } from '@/lib/router'
import { Home, UtensilsCrossed, ShoppingCart, Store, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useCart } from '@/stores/cart'
import { useHydrated } from '@/hooks/useHydrated'

export function BottomNav() {
  const pathname = usePathname()
  const params = useSearchParams()
  const store = params.get('store')
  const count = useCart(s => s.count())
  const hydrated = useHydrated()

  const onShop = pathname === '/shop'
  const isHome = pathname === '/'
  const isRestaurant = onShop && store !== 'supermarket'
  const isSupermarket = onShop && store === 'supermarket'
  const isAccount = pathname.startsWith('/account')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="pointer-events-auto mx-auto flex max-w-app items-center justify-around rounded-[30px] border border-line/70 bg-white/90 px-3 py-2 shadow-pop backdrop-blur-xl">
          <NavItem to="/" icon={Home} label="Home" active={isHome} />
          <NavItem to="/shop?store=restaurant" icon={UtensilsCrossed} label="Meals" active={isRestaurant} />

          <Link
            to="/cart"
            className="flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold text-brand"
          >
            <span className="relative -mt-8 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop ring-4 ring-white transition-transform active:scale-95">
              <ShoppingCart size={24} />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-ink px-1 text-[10px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            Cart
          </Link>

          <NavItem to="/shop?store=supermarket" icon={Store} label="Mart" active={isSupermarket} />
          <NavItem to="/account" icon={User} label="Account" active={isAccount} />
        </div>
      </div>
    </nav>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string
  icon: LucideIcon
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors',
        active ? 'text-brand' : 'text-ink-muted'
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} className={cn(active && 'fill-brand/10')} />
      <span className="leading-none">{label}</span>
      <span className={cn('h-1 w-1 rounded-full transition-colors', active ? 'bg-brand' : 'bg-transparent')} />
    </Link>
  )
}
