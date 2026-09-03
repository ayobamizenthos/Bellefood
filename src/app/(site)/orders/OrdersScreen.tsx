'use client'

import { Link } from '@/lib/router'
import { Package } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { formatDate, formatNaira } from '@/lib/format'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const statusTone: Record<OrderStatus, string> = {
  pending: 'bg-line text-ink-muted',
  processing: 'bg-brand-tint text-brand',
  out_for_delivery: 'bg-brand-tint text-brand',
  delivered: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
}

export default function OrdersPage() {
  const { orders, loading } = useOrders()

  if (loading) return <PageSpinner />

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Package size={40} className="text-ink-muted" />
        <h1 className="text-xl font-bold">No orders yet</h1>
        <p className="text-body text-ink-muted">Your orders and live tracking will appear here.</p>
        <Link to="/shop">
          <Button className="mt-2">Start Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Your Orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map(order => {
          const items = order.items as { name?: string }[]
          return (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-card transition-colors hover:border-brand"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{order.order_number}</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-label font-semibold',
                    statusTone[order.status]
                  )}
                >
                  {ORDER_STATUS_META[order.status].label}
                </span>
              </div>
              <p className="text-body text-ink-muted">
                {formatDate(order.created_at)} · {items.length} item{items.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand">{formatNaira(order.total)}</span>
                {order.payment_status === 'pending' && (
                  <span className="text-label font-medium text-ink-muted">
                    Awaiting payment verification
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
