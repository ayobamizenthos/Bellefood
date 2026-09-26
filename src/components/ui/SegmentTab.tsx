import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SegmentTabProps {
  active: boolean
  onSelect: () => void
  children: ReactNode
}

/** One option of a two-way switch such as Meals or Mart. */
export function SegmentTab({ active, onSelect, children }: SegmentTabProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-body font-semibold transition-colors',
        active ? 'bg-brand text-white shadow-card' : 'text-ink-muted hover:bg-line/50'
      )}
    >
      {children}
    </button>
  )
}
