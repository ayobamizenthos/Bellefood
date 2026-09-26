'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Package, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useAdmin'
import { formatDateTime, formatNaira } from '@/lib/format'
import { revenueBuckets } from '@/lib/revenue'
import type { RevenueRange } from '@/lib/revenue'
import { palette } from '@/lib/palette'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Chip } from '@/components/ui/Chip'
import { StatusPill } from '@/components/order/StatusPill'

const RANGES: { key: RevenueRange; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '3m', label: '3 months' },
  { key: '12m', label: '12 months' },
  { key: 'custom', label: 'Custom' },
]

export default function DashboardScreen() {
  const { stats, loading } = useDashboardStats()
  const [range, setRange] = useState<RevenueRange>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const paidOrders = stats?.paidOrders
  const revenue = useMemo(
    () => (paidOrders ?? []).reduce((sum, order) => sum + Number(order.total), 0),
    [paidOrders]
  )
  const buckets = useMemo(
    () => revenueBuckets(paidOrders ?? [], range, customFrom, customTo),
    [paidOrders, range, customFrom, customTo]
  )
  const rangeTotal = buckets.reduce((sum, bucket) => sum + bucket.total, 0)

  if (loading || !stats) return <PageSpinner />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue" value={formatNaira(revenue)} />
        <StatCard icon={ShoppingBag} label="Orders" value={String(stats.orderCount)} />
        <StatCard icon={Package} label="Products" value={String(stats.productCount)} />
        <StatCard icon={Users} label="Customers" value={String(stats.customerCount)} />
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Revenue</h2>
          <span className="text-body font-semibold text-brand">{formatNaira(rangeTotal)}</span>
        </div>

        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
          {RANGES.map(option => (
            <Chip key={option.key} active={range === option.key} onClick={() => setRange(option.key)}>
              {option.label}
            </Chip>
          ))}
        </div>

        {range === 'custom' && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-body">
            <label className="flex items-center gap-2">
              <span className="text-ink-muted">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={event => setCustomFrom(event.target.value)}
                className="input h-11 w-auto"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-ink-muted">To</span>
              <input
                type="date"
                value={customTo}
                onChange={event => setCustomTo(event.target.value)}
                className="input h-11 w-auto"
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
                stroke={palette.ink.subtle}
                interval="preserveStartEnd"
              />
              <Tooltip
                cursor={{ fill: palette.brand.DEFAULT, fillOpacity: 0.08 }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48} fill={palette.brand.DEFAULT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="flex min-h-[44px] items-center text-body font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="divide-y divide-line">
          {stats.recentOrders.map(order => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
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
          {stats.recentOrders.length === 0 && (
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
