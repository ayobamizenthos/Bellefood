'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Link } from '@/lib/router'
import { Home, UtensilsCrossed, ShoppingCart, Store, User } from 'lucide-react'
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

  const tab = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
      active ? 'text-brand' : 'text-ink-muted'
    )

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
      <div className="mx-auto flex max-w-app items-stretch justify-around">
        <Link to="/" className={tab(isHome)}>
          <Home size={22} className={cn(isHome && 'fill-brand/10')} />
          Home
        </Link>
        <Link to="/shop?store=restaurant" className={tab(isRestaurant)}>
          <UtensilsCrossed size={22} className={cn(isRestaurant && 'fill-brand/10')} />
          Kitchen
        </Link>
        <Link
          to="/cart"
          className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-semibold text-brand"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-brand text-white shadow-pop">
            <ShoppingCart size={20} />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-ink px-1 text-[9px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </span>
          Cart
        </Link>
        <Link to="/shop?store=supermarket" className={tab(isSupermarket)}>
          <Store size={22} className={cn(isSupermarket && 'fill-brand/10')} />
          Market
        </Link>
        <Link to="/account" className={tab(isAccount)}>
          <User size={22} className={cn(isAccount && 'fill-brand/10')} />
          Account
        </Link>
      </div>
    </nav>
  )
}
