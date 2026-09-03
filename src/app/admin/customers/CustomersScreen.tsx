'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAdminCustomers } from '@/hooks/useAdmin'
import { formatDate, formatNaira } from '@/lib/format'
import { PageSpinner } from '@/components/ui/PageSpinner'

export default function AdminCustomers() {
  const { customers, loading } = useAdminCustomers()
  const [search, setSearch] = useState('')

  if (loading) return <PageSpinner />

  const filtered = customers.filter(c =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Customers</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="input pl-10"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line px-4 py-3 text-label font-semibold text-ink-muted md:grid">
          <span>Customer</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Joined</span>
        </div>
        <div className="divide-y divide-line">
          {filtered.map(customer => (
            <div
              key={customer.id}
              className="grid grid-cols-2 gap-2 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4"
            >
              <div>
                <p className="font-semibold">{customer.full_name ?? 'Unnamed'}</p>
                {customer.phone && <p className="text-label text-ink-muted">{customer.phone}</p>}
              </div>
              <span className="text-right font-semibold md:text-right">
                {customer.total_orders}
              </span>
              <span className="text-right font-semibold text-brand">
                {formatNaira(customer.total_spent)}
              </span>
              <span className="hidden text-right text-body text-ink-muted md:block">
                {formatDate(customer.created_at)}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-body text-ink-muted">No customers found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
