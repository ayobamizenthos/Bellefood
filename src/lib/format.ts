const LAGOS_TIME_ZONE = 'Africa/Lagos'
const MINUTE_MS = 60_000

// Older Safari throws when maximumFractionDigits drops below the currency default without a minimum.
const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const lagosDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: LAGOS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const formatNaira = (amount: number): string => naira.format(amount)

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: LAGOS_TIME_ZONE,
  })

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LAGOS_TIME_ZONE,
  })

/** The calendar day in Lagos, as YYYY-MM-DD, for an instant or ISO timestamp. */
export const lagosDayKey = (instant: string | Date): string => lagosDate.format(new Date(instant))

/** The calendar month in Lagos, as YYYY-MM. */
export const lagosMonthKey = (instant: string | Date): string => lagosDayKey(instant).slice(0, 7)

export function relativeTime(iso: string, now: number = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / MINUTE_MS)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}
