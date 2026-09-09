'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/stores/auth'
import { NotificationWatcher } from '@/components/NotificationWatcher'
import { AppBadgeSync } from '@/components/AppBadgeSync'
import { ToastHost } from '@/components/ToastHost'
import { SupportSheet } from '@/components/SupportSheet'
import { useCart } from '@/stores/cart'
import { useWishlist } from '@/stores/wishlist'
import { usePreferences } from '@/stores/preferences'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useCart.persist.rehydrate()
    useWishlist.persist.rehydrate()
    usePreferences.persist.rehydrate()
  }, [])

  return (
    <AuthProvider>
      <NotificationWatcher />
      <AppBadgeSync />
      <ToastHost />
      {children}
      <SupportSheet />
    </AuthProvider>
  )
}
