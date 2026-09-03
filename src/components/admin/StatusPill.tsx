import { ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function StatusPill({ status }: { status: OrderStatus }) {
  const done = status === 'delivered' || status === 'completed'
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-label font-semibold',
        status === 'pending'
          ? 'bg-line text-ink-muted'
          : done
            ? 'bg-success/10 text-success'
            : 'bg-brand-tint text-brand'
      )}
    >
      {ORDER_STATUS_META[status].label}
    </span>
  )
}
