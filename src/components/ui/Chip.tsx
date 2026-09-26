import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-body font-medium transition-colors',
        active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
      )}
    >
      {children}
    </button>
  )
}
