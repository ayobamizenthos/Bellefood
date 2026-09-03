import { Check } from 'lucide-react'
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import type { OrderStatusLog } from '@/lib/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const PICKUP_LABELS: Partial<Record<OrderStatus, string>> = {
  out_for_delivery: 'Ready for Pickup',
  delivered: 'Picked Up',
}

export function StatusTimeline({
  current,
  log,
  isPickup,
}: {
  current: OrderStatus
  log: OrderStatusLog[]
  isPickup: boolean
}) {
  const stages: readonly OrderStatus[] = ORDER_STATUSES
  const currentIndex = ORDER_STATUSES.indexOf(current)

  const timestampFor = (status: OrderStatus) =>
    log.find(entry => entry.status === status)?.created_at ?? null

  return (
    <ol className="flex flex-col">
      {stages.map((status, i) => {
        const reached = i <= currentIndex
        const isCurrent = i === currentIndex
        const meta = ORDER_STATUS_META[status]
        const timestamp = timestampFor(status)
        const last = i === stages.length - 1

        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  isCurrent
                    ? 'border-brand bg-brand text-white'
                    : reached
                      ? 'border-success bg-success text-white'
                      : 'border-line bg-white text-ink-muted'
                )}
              >
                {reached && !isCurrent ? (
                  <Check size={16} />
                ) : (
                  <span className="text-label font-bold">{i + 1}</span>
                )}
              </span>
              {!last && <span className={cn('w-0.5 flex-1', reached ? 'bg-success' : 'bg-line')} />}
            </div>

            <div className={cn('pb-6', last && 'pb-0')}>
              <p
                className={cn(
                  'font-semibold',
                  isCurrent ? 'text-brand' : reached ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {(isPickup && PICKUP_LABELS[status]) || meta.label}
              </p>
              <p className="text-body text-ink-muted">{meta.description}</p>
              {timestamp && (
                <p className="mt-0.5 text-label text-ink-muted">{formatDateTime(timestamp)}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
