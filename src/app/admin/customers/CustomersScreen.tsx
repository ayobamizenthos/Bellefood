'use client'

import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminCustomers } from '@/hooks/useAdmin'
import { formatDate, formatDateTime, formatNaira } from '@/lib/format'
import type { Order, Profile } from '@/lib/types'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { StatusPill } from '@/components/admin/StatusPill'
import { cn } from '@/lib/cn'

export default function AdminCustomers() {
  const { customers, loading } = useAdminCustomers()
  const [search, setSearch] = useState('')

  if (loading) return <PageSpinner />

  const needle = search.trim().toLowerCase()
  const filtered = customers.filter(
    customer =>
      (customer.full_name ?? '').toLowerCase().includes(needle) ||
      (customer.phone ?? '').toLowerCase().includes(needle)
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Customers</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="input pl-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map(customer => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-line bg-white px-4 py-8 text-center text-body text-ink-muted">
            No customers found.
          </p>
        )}
      </div>
    </div>
  )
}

function CustomerCard({ customer }: { customer: Profile }) {
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState<Order[] | null>(null)

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && orders === null) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-tint/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
          {(customer.full_name ?? '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{customer.full_name ?? 'Unnamed'}</p>
          <p className="truncate text-label text-ink-muted">
            {customer.phone ?? 'No phone'} · Joined {formatDate(customer.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-label text-ink-muted">
            {customer.total_orders} order{customer.total_orders === 1 ? '' : 's'}
          </p>
          <p className="font-bold text-brand">{formatNaira(customer.total_spent)}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2 text-label">
            <span className="rounded-full bg-brand-tint px-2.5 py-1 font-semibold text-brand">
              🎁 {customer.points.toLocaleString()} points
            </span>
            {customer.username && (
              <span className="rounded-full bg-line/50 px-2.5 py-1 font-medium text-ink">
                @{customer.username}
              </span>
            )}
          </div>
          {orders === null ? (
            <p className="text-body text-ink-muted">Loading order history…</p>
          ) : orders.length === 0 ? (
            <p className="text-body text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map(order => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-brand-tint/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold">{order.order_number}</p>
                    <p className="text-label text-ink-muted">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill status={order.status} />
                    <span className="font-semibold text-brand">{formatNaira(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
