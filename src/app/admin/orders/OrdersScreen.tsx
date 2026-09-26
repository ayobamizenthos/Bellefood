'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useAdminOrders } from '@/hooks/useAdmin'
import type { OrderFilter } from '@/hooks/useAdmin'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ORDER_STAGES, ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { orderAddress } from '@/lib/types'
import { formatDateTime, formatNaira } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { StatusPill } from '@/components/order/StatusPill'

const SEARCH_DEBOUNCE_MS = 300
const FILTERS: readonly OrderStatus[] = [...ORDER_STAGES, 'cancelled']

const PAYMENT_TONE = {
  verified: { label: 'Paid', className: 'text-success' },
  pending: { label: 'Pending', className: '' },
  failed: { label: 'Not received', className: 'text-danger' },
} as const

export default function OrdersScreen() {
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const { orders, loading, hasMore, loadMore } = useAdminOrders(filter, search)
  const [loadingMore, setLoadingMore] = useState(false)

  const showMore = async () => {
    setLoadingMore(true)
    await loadMore()
    setLoadingMore(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by name, phone, or order number"
          aria-label="Search orders"
          className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-12 text-body outline-none focus:border-brand"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-ink-muted"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        {FILTERS.map(status => (
          <Chip key={status} active={filter === status} onClick={() => setFilter(status)}>
            {ORDER_STATUS_META[status].label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map(order => {
            const address = orderAddress(order)
            const payment = PAYMENT_TONE[order.payment_status]
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
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
                    <span className={cn(payment.className)}>{payment.label}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill status={order.status} />
                  <span className="font-bold text-brand">{formatNaira(order.total)}</span>
                </div>
              </Link>
            )
          })}
          {orders.length === 0 && (
            <p className="rounded-2xl border border-line bg-white px-4 py-8 text-center text-body text-ink-muted">
              {query ? 'No orders match your search.' : 'No orders.'}
            </p>
          )}
          {hasMore && (
            <Button variant="secondary" loading={loadingMore} onClick={showMore}>
              Load more orders
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
