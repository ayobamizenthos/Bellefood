'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, CircleX, CreditCard, Package, ShoppingBag, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/stores/auth'
import type { NotificationType } from '@/lib/constants'
import { notificationHref } from '@/lib/routes'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button, buttonClassName } from '@/components/ui/Button'

const MARK_READ_DELAY_MS = 800

const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  payment_verified: CreditCard,
  processing: Package,
  out_for_delivery: Truck,
  delivered: CheckCheck,
  completed: CheckCheck,
  new_order: ShoppingBag,
  cancelled: CircleX,
}

export default function NotificationsScreen() {
  const { items, loading, unreadCount, markAllRead, markRead } = useNotifications()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (loading || unreadCount === 0) return
    const timer = setTimeout(markAllRead, MARK_READ_DELAY_MS)
    return () => clearTimeout(timer)
  }, [loading, unreadCount, markAllRead])

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-app flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Bell size={40} className="text-ink-muted" />
          <p className="font-semibold">No notifications yet</p>
          <p className="text-body text-ink-muted">Order updates will show up here.</p>
          <Link href="/shop" className={cn(buttonClassName(), 'mt-2')}>
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(notification => {
            const Icon = NOTIFICATION_ICON[notification.type]
            return (
              <li key={notification.id}>
                <Link
                  href={notificationHref(notification, isAdmin)}
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    'flex gap-3 rounded-2xl border p-4 transition-colors',
                    notification.is_read ? 'border-line bg-white' : 'border-brand/30 bg-brand-tint/50'
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold leading-tight">{notification.title}</span>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </span>
                    <span className="block text-body text-ink-muted">{notification.message}</span>
                    <span className="mt-0.5 block text-label text-ink-muted">
                      {relativeTime(notification.created_at)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
