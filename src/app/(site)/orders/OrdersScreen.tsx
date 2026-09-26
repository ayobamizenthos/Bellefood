'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { orderItems } from '@/lib/types'
import { formatDate, formatNaira } from '@/lib/format'
import { PAYMENT_STATUS_LABEL } from '@/lib/constants'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { buttonClassName } from '@/components/ui/Button'
import { StatusPill } from '@/components/order/StatusPill'
import { cn } from '@/lib/cn'

export default function OrdersScreen() {
  const { orders, loading } = useOrders()

  if (loading) return <PageSpinner />

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Package size={40} className="text-ink-muted" />
        <h1 className="text-xl font-bold">No orders yet</h1>
        <p className="text-body text-ink-muted">Your orders and live tracking will appear here.</p>
        <Link href="/shop" className={cn(buttonClassName(), 'mt-2')}>
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Your Orders</h1>
      <ul className="flex flex-col gap-3">
        {orders.map(order => {
          const itemCount = orderItems(order).length
          const awaitingPayment = order.payment_status !== 'verified' && order.status !== 'cancelled'
          return (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-card transition-colors hover:border-brand"
              >
                <span className="flex items-center justify-between">
                  <span className="font-bold">{order.order_number}</span>
                  <StatusPill status={order.status} />
                </span>
                <span className="text-body text-ink-muted">
                  {formatDate(order.created_at)} · {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
                <span className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand">{formatNaira(order.total)}</span>
                  {awaitingPayment && (
                    <span
                      className={cn(
                        'text-label font-medium',
                        order.payment_status === 'failed' ? 'text-danger' : 'text-ink-muted'
                      )}
                    >
                      Payment: {PAYMENT_STATUS_LABEL[order.payment_status]}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
