'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Share2, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const REVEAL_DELAY_MS = 2000

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

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [installed, setInstalled] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setMounted(true)
    setIosHint(isIosSafari())

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const canShow = mounted && !installed && !isStandalone() && (Boolean(installEvent) || iosHint)

  // Roll the pill out from the logo a beat after it becomes available,
  // then roll it back in on its own after a short glance.
  useEffect(() => {
    if (!canShow) return
    let collapseTimer: ReturnType<typeof setTimeout>
    const revealTimer = setTimeout(() => {
      setCollapsed(false)
      collapseTimer = setTimeout(() => setCollapsed(true), 4000)
    }, REVEAL_DELAY_MS)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(collapseTimer)
    }
  }, [canShow])

  if (!canShow) return null

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  return (
    <div className="animate-slide-up fixed bottom-[calc(70px+env(safe-area-inset-bottom)+12px)] left-3 z-50 max-w-[calc(100vw-1.5rem)] md:bottom-6 md:left-6 md:max-w-md">
      <div className="flex items-center rounded-full border border-line bg-white/95 shadow-pop backdrop-blur-md">
        <button
          type="button"
          onClick={collapsed ? () => setCollapsed(false) : undefined}
          aria-label={collapsed ? 'Show install option' : 'BelleFOOD'}
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-full transition-transform',
            collapsed && 'active:scale-95'
          )}
        >
          <Image
            src="/bellefood-glyph.png"
            alt="Belle Food"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </button>

        <div
          className="grid min-w-0 transition-[grid-template-columns] duration-500 ease-out"
          style={{ gridTemplateColumns: collapsed ? '0fr' : '1fr' }}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 pr-1.5">
              {iosHint ? (
                <p className="flex min-w-0 flex-1 items-center gap-1 truncate text-[13px] text-ink">
                  Tap
                  <Share2 size={13} aria-hidden="true" className="shrink-0" />
                  then <span className="font-semibold">Add to Home Screen</span>
                </p>
              ) : (
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  Install BelleFOOD app
                </p>
              )}

              {!iosHint && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark"
                >
                  Install
                </button>
              )}

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse install prompt"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-brand-tint hover:text-ink"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
