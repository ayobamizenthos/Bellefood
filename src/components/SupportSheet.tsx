'use client'

import { Instagram, MessageCircle, X } from 'lucide-react'
import { useSupportSheet } from '@/stores/support'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useDialog } from '@/hooks/useDialog'
import { STORE } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function SupportSheet() {
  const open = useSupportSheet(state => state.open)
  const hide = useSupportSheet(state => state.hide)
  const { settings } = useStoreSettings()
  const sheetRef = useDialog<HTMLDivElement>(open, hide)

  if (!open) return null

  const whatsapp = settings?.whatsapp_number || STORE.whatsappNumber

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={hide}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-sheet-title"
        className="relative z-10 w-full max-w-app rounded-t-3xl bg-white p-5 shadow-pop animate-slide-up sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="support-sheet-title" className="text-lg font-bold">
            Contact Support
          </h2>
          <button
            type="button"
            onClick={hide}
            aria-label="Close"
            className="-mr-2 grid h-11 w-11 place-items-center text-ink-muted"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <SupportLink
            href={`https://wa.me/${whatsapp}`}
            onSelect={hide}
            icon={<MessageCircle size={22} />}
            iconClassName="bg-success/10 text-success"
            title="WhatsApp"
            detail="Chat with us instantly"
          />
          <SupportLink
            href={`https://instagram.com/${STORE.instagramHandle}`}
            onSelect={hide}
            icon={<Instagram size={22} />}
            iconClassName="bg-brand-tint text-brand"
            title="Instagram"
            detail={`@${STORE.instagramHandle}`}
          />
        </div>
      </div>
    </div>
  )
}

function SupportLink({
  href,
  onSelect,
  icon,
  iconClassName,
  title,
  detail,
}: {
  href: string
  onSelect: () => void
  icon: React.ReactNode
  iconClassName: string
  title: string
  detail: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onSelect}
      className="flex items-center gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-brand"
    >
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full', iconClassName)}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block truncate text-body text-ink-muted">{detail}</span>
      </span>
    </a>
  )
}
