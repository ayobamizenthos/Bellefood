import { lagosDayKey, lagosMonthKey } from './format'

export type RevenueRange = '7d' | '30d' | '3m' | '12m' | 'custom'

export interface PaidOrder {
  total: number
  created_at: string
}

const DAY_MS = 86_400_000
const MONTHLY_AFTER_DAYS = 62
const WEEKDAY_LABELS_UP_TO_DAYS = 7

export interface RevenueBucket {
  label: string
  total: number
}

// Buckets are built on UTC calendar dates that stand for Lagos dates, so no local offset leaks in.
const utcDate = (key: string) => new Date(`${key}T00:00:00Z`)

function lastDays(todayKey: string, days: number): { start: Date; end: Date } {
  const end = utcDate(todayKey)
  return { start: new Date(end.getTime() - (days - 1) * DAY_MS), end }
}

export function revenueBuckets(
  paidOrders: PaidOrder[],
  range: RevenueRange,
  customFrom: string,
  customTo: string,
  now: Date = new Date()
): RevenueBucket[] {
  const todayKey = lagosDayKey(now)
  let { start, end } = lastDays(todayKey, range === '30d' ? 30 : 7)
  let monthly = range === '3m' || range === '12m'

  if (monthly) {
    const today = utcDate(todayKey)
    const monthsBack = range === '12m' ? 11 : 2
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsBack, 1))
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  } else if (range === 'custom' && customFrom && customTo) {
    start = utcDate(customFrom)
    end = utcDate(customTo)
    if (end < start) [start, end] = [end, start]
    monthly = (end.getTime() - start.getTime()) / DAY_MS > MONTHLY_AFTER_DAYS
    if (monthly) {
      start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
      end = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    }
  }

  const totals = new Map<string, number>()
  for (const order of paidOrders) {
    const key = monthly ? lagosMonthKey(order.created_at) : lagosDayKey(order.created_at)
    totals.set(key, (totals.get(key) ?? 0) + Number(order.total))
  }

  const buckets: RevenueBucket[] = []
  const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MS)
  const cursor = new Date(start)
  while (cursor <= end) {
    const dayKey = cursor.toISOString().slice(0, 10)
    const key = monthly ? dayKey.slice(0, 7) : dayKey
    const label = cursor.toLocaleDateString('en-NG', {
      timeZone: 'UTC',
      ...(monthly
        ? { month: 'short' }
        : spanDays < WEEKDAY_LABELS_UP_TO_DAYS
          ? { weekday: 'short' }
          : { day: 'numeric', month: 'short' }),
    })
    buckets.push({ label, total: totals.get(key) ?? 0 })
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    else cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return buckets
}
