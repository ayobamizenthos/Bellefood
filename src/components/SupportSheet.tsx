import { MessageCircle, Mail, X } from 'lucide-react'
import { useSupportSheet } from '@/stores/support'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { STORE } from '@/lib/constants'

export function SupportSheet() {
  const { open, hide } = useSupportSheet()
  const { settings } = useStoreSettings()

  if (!open) return null

  const whatsapp = settings?.whatsapp_number || STORE.whatsappNumber
  const email = settings?.support_email || STORE.supportEmail

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={hide}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-app rounded-t-3xl bg-white p-5 shadow-pop animate-slide-up sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Contact Support</h2>
          <button type="button" onClick={hide} aria-label="Close" className="text-ink-muted">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            onClick={hide}
            className="flex items-center gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-brand"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success/10 text-success">
              <MessageCircle size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">WhatsApp</p>
              <p className="truncate text-body text-ink-muted">Chat with us instantly</p>
            </div>
          </a>

          <a
            href={`mailto:${email}`}
            onClick={hide}
            className="flex items-center gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-brand"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand">
              <Mail size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Email</p>
              <p className="truncate text-body text-ink-muted">{email}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
