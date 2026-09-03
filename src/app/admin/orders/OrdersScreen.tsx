'use client'

import { useState } from 'react'
import { Link } from '@/lib/router'
import { useAdminOrders } from '@/hooks/useAdmin'
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { formatDate, formatNaira } from '@/lib/format'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { StatusPill } from '@/components/admin/StatusPill'
import { cn } from '@/lib/cn'

type Filter = OrderStatus | 'all'

export default function AdminOrders() {
  const [filter, setFilter] = useState<Filter>('all')
  const { orders, loading } = useAdminOrders(filter)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        {ORDER_STATUSES.map(status => (
          <Chip key={status} active={filter === status} onClick={() => setFilter(status)}>
            {ORDER_STATUS_META[status].label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition-colors hover:border-brand"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{order.order_number}</p>
                <p className="text-label text-ink-muted">
                  {formatDate(order.created_at)} ·{' '}
                  <span className={cn(order.payment_status === 'verified' && 'text-success')}>
                    {order.payment_status === 'verified' ? 'Paid' : 'Pending'}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={order.status} />
                <span className="font-bold text-brand">{formatNaira(order.total)}</span>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <p className="rounded-2xl border border-line bg-white px-4 py-8 text-center text-body text-ink-muted">
              No orders.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-body font-medium',
        active ? 'border-brand bg-brand text-white' : 'border-line bg-white'
      )}
    >
      {children}
    </button>
  )
}
