'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/stores/auth'
import { usePrompts } from '@/stores/prompts'
import { Button } from '@/components/ui/Button'

const DISMISS_KEY = 'bellefood-push-optin-dismissed'

export function PushOptIn() {
  const { session } = useAuth()
  const { supported, state, busy, subscribe } = usePushNotifications()
  const setPushPromptVisible = usePrompts(prompts => prompts.setPushPromptVisible)
  const [snoozed, setSnoozed] = useState(true)

  useEffect(() => {
    try {
      setSnoozed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setSnoozed(false)
    }
  }, [])

  const visible = Boolean(session) && supported && state !== 'granted' && !snoozed

  useEffect(() => {
    setPushPromptVisible(visible)
  }, [visible, setPushPromptVisible])

  const dismiss = () => {
    setSnoozed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // without storage the snooze lasts for this visit only
    }
  }

  if (!visible) return null

  const denied = state === 'denied'

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+96px)] z-50 mx-auto max-w-app animate-slide-up rounded-2xl border border-brand/30 bg-white p-4 shadow-pop md:bottom-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-ink-muted"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
          <Bell size={20} />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Order alerts</p>
          <p className="text-body text-ink-muted">
            {denied
              ? 'Notifications are blocked. Allow them for this site in your browser settings.'
              : 'Sound and alerts, even when the app is closed.'}
          </p>
          {!denied && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={busy} onClick={subscribe}>
                Enable notifications
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Later
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
