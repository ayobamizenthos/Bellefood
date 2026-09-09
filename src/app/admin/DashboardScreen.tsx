'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/router'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { TrendingUp, ShoppingBag, Package, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAdminOrders, useAdminProducts, useAdminCustomers } from '@/hooks/useAdmin'
import { formatNaira, formatDateTime } from '@/lib/format'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { StatusPill } from '@/components/admin/StatusPill'
import { cn } from '@/lib/cn'

type RangeKey = '7d' | '30d' | '3m' | '12m' | 'custom'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '3m', label: '3 months' },
  { key: '12m', label: '12 months' },
  { key: 'custom', label: 'Custom' },
]

const startOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export default function AdminDashboard() {
  const { orders, loading } = useAdminOrders('all')
  const { products } = useAdminProducts()
  const { customers } = useAdminCustomers()

  const [range, setRange] = useState<RangeKey>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const revenue = useMemo(
    () => orders.filter(o => o.payment_status === 'verified').reduce((sum, o) => sum + o.total, 0),
    [orders]
  )

  const { buckets, rangeLabel } = useMemo(() => {
    const today = startOfDay(new Date())
    let start: Date
    let end = today
    let monthly = false

    if (range === '12m' || range === '3m') {
      monthly = true
      start = new Date(today.getFullYear(), today.getMonth() - (range === '12m' ? 11 : 2), 1)
      end = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (range === 'custom' && customFrom && customTo) {
      start = startOfDay(new Date(customFrom))
      end = startOfDay(new Date(customTo))
      if (end < start) [start, end] = [end, start]
      monthly = (end.getTime() - start.getTime()) / 86400000 > 62
      if (monthly) {
        start = new Date(start.getFullYear(), start.getMonth(), 1)
        end = new Date(end.getFullYear(), end.getMonth(), 1)
      }
    } else {
      const days = range === '30d' ? 29 : 6
      start = new Date(today)
      start.setDate(start.getDate() - days)
    }

    const verified = orders.filter(o => o.payment_status === 'verified')
    const rows: { label: string; total: number }[] = []

    if (monthly) {
      const cursor = new Date(start)
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        const total = verified
          .filter(o => o.created_at.slice(0, 7) === key)
          .reduce((sum, o) => sum + o.total, 0)
        rows.push({ label: cursor.toLocaleDateString('en-NG', { month: 'short' }), total })
        cursor.setMonth(cursor.getMonth() + 1)
      }
    } else {
      const cursor = new Date(start)
      const span = Math.round((end.getTime() - start.getTime()) / 86400000)
      while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10)
        const total = verified
          .filter(o => o.created_at.slice(0, 10) === key)
          .reduce((sum, o) => sum + o.total, 0)
        rows.push({
          label: cursor.toLocaleDateString('en-NG', span <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
          total,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    const rangeTotal = rows.reduce((sum, r) => sum + r.total, 0)
    return { buckets: rows, rangeLabel: formatNaira(rangeTotal) }
  }, [orders, range, customFrom, customTo])

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue" value={formatNaira(revenue)} />
        <StatCard icon={ShoppingBag} label="Orders" value={String(orders.length)} />
        <StatCard icon={Package} label="Products" value={String(products.length)} />
        <StatCard icon={Users} label="Customers" value={String(customers.length)} />
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Revenue</h2>
          <span className="text-body font-semibold text-brand">{rangeLabel}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {RANGES.map(option => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              className={cn(
                'rounded-full px-3 py-1 text-[13px] font-semibold transition-colors',
                range === option.key ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-body">
            <label className="flex items-center gap-2">
              <span className="text-ink-muted">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg border border-line px-2 py-1 outline-none focus:border-brand"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-ink-muted">To</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg border border-line px-2 py-1 outline-none focus:border-brand"
              />
            </label>
          </div>
        )}

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="#9A9A9A"
                interval="preserveStartEnd"
              />
              <Tooltip cursor={{ fill: 'rgba(246,124,43,0.08)' }} content={<ChartTooltip />} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {buckets.map((_, i) => (
                  <Cell key={i} fill="#F67C2B" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-bold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-body font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="divide-y divide-line">
          {orders.slice(0, 8).map(order => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-brand-tint/30"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{order.order_number}</p>
                <p className="text-label text-ink-muted">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusPill status={order.status} />
                <span className="font-bold text-brand">{formatNaira(order.total)}</span>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <p className="px-4 py-6 text-center text-body text-ink-muted">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
      <Icon size={20} className="shrink-0 text-brand" />
      <div className="min-w-0">
        <p className="truncate text-base font-bold leading-tight">{value}</p>
        <p className="truncate text-label text-ink-muted">{label}</p>
      </div>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-pop">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="text-body font-bold text-brand">{formatNaira(payload[0].value)}</p>
    </div>
  )
}
