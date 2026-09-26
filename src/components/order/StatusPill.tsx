import { ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { cn } from '@/lib/cn'

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-line text-ink-muted',
  processing: 'bg-brand-tint text-brand',
  out_for_delivery: 'bg-brand-tint text-brand',
  delivered: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
}

export function StatusPill({ status, label }: { status: OrderStatus; label?: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-label font-semibold', STATUS_TONE[status])}>
      {label ?? ORDER_STATUS_META[status].label}
    </span>
  )
}
