'use client'

import { useEffect } from 'react'
import { Link } from '@/lib/router'
import { Bell, CheckCheck, Package, CreditCard, Truck, ShoppingBag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationType } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'

const iconFor: Record<NotificationType, LucideIcon> = {
  payment_verified: CreditCard,
  processing: Package,
  out_for_delivery: Truck,
  delivered: CheckCheck,
  completed: CheckCheck,
  new_order: ShoppingBag,
}

export default function NotificationsPage() {
  const { items, loading, unreadCount, markAllRead, markRead } = useNotifications()

  useEffect(() => {
    if (!loading && unreadCount > 0) {
      const timer = setTimeout(markAllRead, 800)
      return () => clearTimeout(timer)
    }
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
          <Link to="/shop">
            <Button className="mt-2">Browse products</Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(notification => {
            const Icon = iconFor[notification.type as NotificationType] ?? Bell
            const target = notification.order_id ? `/orders/${notification.order_id}` : '/orders'
            return (
              <li key={notification.id}>
                <Link
                  to={target}
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    'flex gap-3 rounded-2xl border p-4 transition-colors',
                    notification.is_read
                      ? 'border-line bg-white'
                      : 'border-brand/30 bg-brand-tint/50'
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand">
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      )}
                    </div>
                    <p className="text-body text-ink-muted">{notification.message}</p>
                    <p className="mt-0.5 text-label text-ink-muted">
                      {relativeTime(notification.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
