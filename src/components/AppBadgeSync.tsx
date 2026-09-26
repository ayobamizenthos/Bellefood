'use client'

import { useEffect } from 'react'
import { selectUnreadCount, useNotificationStore } from '@/stores/notifications'

type BadgingNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export function AppBadgeSync() {
  const unreadCount = useNotificationStore(selectUnreadCount)

  useEffect(() => {
    const nav = navigator as BadgingNavigator
    if (!nav.setAppBadge) return
    if (unreadCount > 0) nav.setAppBadge(unreadCount).catch(() => {})
    else nav.clearAppBadge?.().catch(() => {})
  }, [unreadCount])

  return null
}
