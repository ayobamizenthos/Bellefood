'use client'

import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { useToasts } from '@/stores/toast'

export function ToastHost() {
  const toasts = useToasts(state => state.toasts)
  const dismiss = useToasts(state => state.dismiss)
  const router = useRouter()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-app flex-col gap-2"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start rounded-2xl border border-line bg-white shadow-pop animate-slide-up"
        >
          <button
            type="button"
            onClick={() => {
              if (toast.href) router.push(toast.href)
              dismiss(toast.id)
            }}
            className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
              <Bell size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{toast.title}</span>
              <span className="line-clamp-2 text-body text-ink-muted">{toast.message}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="grid h-11 w-11 shrink-0 place-items-center text-ink-muted"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
