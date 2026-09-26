'use client'

import { Suspense } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { PushOptIn } from './PushOptIn'
import { InstallPrompt } from './InstallPrompt'
import { Footer } from './Footer'
import { NavLoadingOverlay } from '@/components/ui/NavLoadingOverlay'
import { selectCartCount, useCart } from '@/stores/cart'
import { useHydrated } from '@/hooks/useHydrated'

const BADGE_LIMIT = 99

export function SiteChrome({ children }: { children: ReactNode }) {
  const count = useCart(selectCartCount)
  const hydrated = useHydrated()
  const pathname = usePathname()
  const hideCartButton = pathname === '/cart' || pathname.startsWith('/checkout')

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <NavLoadingOverlay />
      <Header />
      <main className="app-shell flex-1 pb-28 pt-4 md:pb-10">{children}</main>

      <Footer />

      {!hideCartButton && (
        <Link
          href="/cart"
          aria-label="View cart"
          className="fixed bottom-8 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop md:grid"
        >
          <ShoppingCart size={22} />
          {hydrated && count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-ink px-1 text-[11px] font-bold text-white">
              {count > BADGE_LIMIT ? `${BADGE_LIMIT}+` : count}
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
