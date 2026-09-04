'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Share2, X } from 'lucide-react'

const REPROMPT_AFTER_MS = 7 * 24 * 60 * 60 * 1000
const MIN_VISITS = 2
const DISMISS_KEY = 'bellefood-install-dismissed-at'
const VISIT_KEY = 'bellefood-visit-count'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isSuppressed(): boolean {
  const at = Number(window.localStorage.getItem(DISMISS_KEY) || '0')
  return at > 0 && Date.now() - at < REPROMPT_AFTER_MS
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false)
  const [visits, setVisits] = useState(0)
  const [suppressed, setSuppressed] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const next = Number(window.localStorage.getItem(VISIT_KEY) || '0') + 1
    window.localStorage.setItem(VISIT_KEY, String(next))
    setVisits(next)
    setSuppressed(isSuppressed())
    setMounted(true)

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
  }, [])

  if (!mounted) return null
  if (suppressed) return null
  if (isStandalone()) return null
  if (visits < MIN_VISITS) return null

  const showIosHint = isIosSafari()
  if (!installEvent && !showIosHint) return null

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setSuppressed(true)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    dismiss()
  }

  return (
    <div className="animate-slide-up fixed inset-x-3 bottom-[calc(70px+env(safe-area-inset-bottom)+12px)] z-50 md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md">
      <div className="flex items-center gap-3 rounded-full border border-line bg-white/95 py-2 pl-3 pr-2 shadow-pop backdrop-blur-md">
        <span className="shrink-0">
          <Image
            src="/bellefood-mark.png"
            alt="Belle Food"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </span>

        {showIosHint ? (
          <p className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[13px] leading-snug text-ink">
            Tap
            <Share2 size={13} aria-hidden="true" className="shrink-0" />
            then <span className="font-semibold">Add to Home Screen</span>
          </p>
        ) : (
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
            Install the BelleFOOD app
          </p>
        )}

        {!showIosHint ? (
          <button
            type="button"
            onClick={() => void install()}
            className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Install
          </button>
        ) : null}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-brand-tint hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
