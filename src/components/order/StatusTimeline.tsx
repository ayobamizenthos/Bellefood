import { Check } from 'lucide-react'
import { ORDER_STAGES, ORDER_STATUS_META, PICKUP_STAGE_LABELS } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import type { OrderStatusLog } from '@/lib/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

// Rows written before orders skipped "delivered" still count as reaching the last stage.
const stages: readonly OrderStatus[] = ORDER_STAGES

const stageIndex = (status: OrderStatus): number =>
  stages.indexOf(status === 'delivered' ? 'completed' : status)

export function StatusTimeline({
  current,
  log,
  isPickup,
}: {
  current: OrderStatus
  log: OrderStatusLog[]
  isPickup: boolean
}) {
  const currentIndex = stageIndex(current)

  const timestampFor = (status: OrderStatus) =>
    log.find(entry => entry.status === status)?.created_at ?? null

  return (
    <ol className="flex flex-col">
      {ORDER_STAGES.map((status, index) => {
        const reached = index <= currentIndex
        const isCurrent = index === currentIndex
        const meta = ORDER_STATUS_META[status]
        const timestamp = timestampFor(status)
        const last = index === ORDER_STAGES.length - 1

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
                  <span className="text-label font-bold">{index + 1}</span>
                )}
              </span>
              {!last && <span className={cn('w-0.5 flex-1', reached ? 'bg-success' : 'bg-line')} />}
            </div>

            <div className={cn(!last && 'pb-6')}>
              <p
                className={cn(
                  'font-semibold',
                  isCurrent ? 'text-brand' : reached ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {(isPickup && PICKUP_STAGE_LABELS[status]) || meta.label}
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
