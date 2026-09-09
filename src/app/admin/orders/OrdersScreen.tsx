'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/router'
import { Search, X } from 'lucide-react'
import { useAdminOrders } from '@/hooks/useAdmin'
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { formatDateTime, formatNaira } from '@/lib/format'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { StatusPill } from '@/components/admin/StatusPill'
import { cn } from '@/lib/cn'

type Filter = OrderStatus | 'all'

interface DeliveryAddress {
  fullName?: string
  phone?: string
}

export default function AdminOrders() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { orders, loading } = useAdminOrders(filter)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter(order => {
      const address = (order.delivery_address ?? {}) as DeliveryAddress
      return [order.order_number, address.fullName, address.phone]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(needle))
    })
  }, [orders, query])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, phone, or order number"
          className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-10 text-body outline-none focus:border-brand"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-line/60"
          >
            <X size={15} />
          </button>
        )}
      </div>

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
          {results.map(order => {
            const address = (order.delivery_address ?? {}) as DeliveryAddress
            return (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition-colors hover:border-brand"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{address.fullName || order.order_number}</p>
                  <p className="truncate text-label text-ink-muted">
                    {address.phone ? `${address.phone} · ` : ''}
                    {order.order_number}
                  </p>
                  <p className="text-label text-ink-muted">
                    {formatDateTime(order.created_at)} ·{' '}
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
            )
          })}
          {results.length === 0 && (
            <p className="rounded-2xl border border-line bg-white px-4 py-8 text-center text-body text-ink-muted">
              {query ? 'No orders match your search.' : 'No orders.'}
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
