'use client'

import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Link } from '@/lib/router'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { PushOptIn } from './PushOptIn'
import { InstallPrompt } from './InstallPrompt'
import { Footer } from './Footer'
import { useCart } from '@/stores/cart'
import { useHydrated } from '@/hooks/useHydrated'

export function SiteChrome({ children }: { children: ReactNode }) {
  const count = useCart(s => s.count())
  const hydrated = useHydrated()
  const pathname = usePathname()
  const hideCartFab = pathname === '/cart' || pathname.startsWith('/checkout')

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Header />
      <main className="app-shell flex-1 pb-24 pt-4 md:pb-10">{children}</main>

      <Footer />

      {!hideCartFab && (
        <Link
          to="/cart"
          aria-label="View cart"
          className="fixed bottom-8 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop md:grid"
        >
          <ShoppingCart size={22} />
          {hydrated && count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-ink px-1 text-[11px] font-bold text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      )}

      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <PushOptIn />
      <InstallPrompt />
    </div>
  )
}
