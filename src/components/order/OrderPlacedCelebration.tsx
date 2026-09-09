'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { playOrderPlaced } from '@/lib/sounds'

interface OrderPlacedCelebrationProps {
  orderNumber: string
  isPickup: boolean
  onDismiss: () => void
}

export function OrderPlacedCelebration({
  orderNumber,
  isPickup,
  onDismiss,
}: OrderPlacedCelebrationProps) {
  useEffect(() => {
    playOrderPlaced()
  }, [])

  return (
    <div className="fixed inset-0 z-[60] grid animate-fade-in place-items-center bg-ink/40 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm animate-pop-in flex-col items-center rounded-3xl bg-white p-8 text-center shadow-pop">
        <div className="relative mb-5 grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-ring-out rounded-full bg-success/30" />
          <span className="grid h-24 w-24 animate-check-pop place-items-center rounded-full bg-success text-white">
            <Check size={48} strokeWidth={3} />
          </span>
        </div>
        <h2 className="text-2xl font-bold text-ink">Order placed!</h2>
        <p className="mt-1 text-body text-ink-muted">
          {isPickup
            ? 'We will let you know as soon as it is ready to collect.'
            : 'We will notify you the moment your payment is confirmed.'}
        </p>
        <p className="mt-4 rounded-xl bg-brand-tint px-4 py-2 text-body font-semibold text-brand">
          {orderNumber}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 h-12 w-full rounded-xl bg-brand text-body font-semibold text-white transition-transform active:scale-95"
        >
          Track my order
        </button>
      </div>
    </div>
  )
}
