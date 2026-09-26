'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, ShoppingCart, Store, User, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { selectCartCount, useCart } from '@/stores/cart'
import { useHydrated } from '@/hooks/useHydrated'

const BADGE_LIMIT = 9

export function BottomNav() {
  const pathname = usePathname()
  const params = useSearchParams()
  const store = params.get('store')
  const count = useCart(selectCartCount)
  const hydrated = useHydrated()

  const onShop = pathname === '/shop'
  const isRestaurant = onShop && store !== 'supermarket'
  const isSupermarket = onShop && store === 'supermarket'

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="pointer-events-auto mx-auto flex max-w-app items-center justify-around rounded-[30px] border border-line/70 bg-white/90 px-3 py-2 shadow-pop backdrop-blur-xl">
          <NavItem href="/" icon={Home} label="Home" active={pathname === '/'} />
          <NavItem href="/shop?store=restaurant" icon={UtensilsCrossed} label="Meals" active={isRestaurant} />

          <Link
            href="/cart"
            aria-current={pathname === '/cart' ? 'page' : undefined}
            className="flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold text-brand"
          >
            <span className="relative -mt-8 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop ring-4 ring-white transition-transform active:scale-95">
              <ShoppingCart size={24} />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-ink px-1 text-[10px] font-bold text-white">
                  {count > BADGE_LIMIT ? `${BADGE_LIMIT}+` : count}
                </span>
              )}
            </span>
            Cart
          </Link>

          <NavItem href="/shop?store=supermarket" icon={Store} label="Mart" active={isSupermarket} />
          <NavItem href="/account" icon={User} label="Account" active={pathname.startsWith('/account')} />
        </div>
      </div>
    </nav>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors',
        active ? 'text-brand' : 'text-ink-muted'
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} className={cn(active && 'fill-brand/10')} />
      <span className="leading-none">{label}</span>
      <span className={cn('h-1 w-1 rounded-full transition-colors', active ? 'bg-brand' : 'bg-transparent')} />
    </Link>
  )
}
