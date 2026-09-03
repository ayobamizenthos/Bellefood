import { useNavigate } from '@/lib/router'
import { Bell, X } from 'lucide-react'
import { useToasts } from '@/stores/toast'

export function ToastHost() {
  const { toasts, dismiss } = useToasts()
  const navigate = useNavigate()

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-app flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => {
            if (toast.href) navigate(toast.href)
            dismiss(toast.id)
          }}
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-3 shadow-pop animate-slide-up"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
            <Bell size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{toast.title}</p>
            <p className="line-clamp-2 text-body text-ink-muted">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              dismiss(toast.id)
            }}
            aria-label="Dismiss"
            className="shrink-0 text-ink-muted"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
