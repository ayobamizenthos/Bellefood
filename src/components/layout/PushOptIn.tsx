import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/ui/Button'

export function PushOptIn() {
  const { session } = useAuth()
  const { supported, state, busy, subscribe } = usePushNotifications()
  const [snoozed, setSnoozed] = useState(false)

  if (!session || !supported || state === 'granted' || snoozed) return null

  const denied = state === 'denied'

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-app animate-slide-up rounded-2xl border border-brand/30 bg-white p-4 shadow-pop md:bottom-6">
      <button
        type="button"
        onClick={() => setSnoozed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-ink-muted"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
          <Bell size={20} />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Turn on order alerts</p>
          {denied ? (
            <p className="text-body text-ink-muted">
              Notifications are blocked. Tap the lock icon in your browser address bar and allow
              notifications for this site to get order alerts and sounds.
            </p>
          ) : (
            <p className="text-body text-ink-muted">
              Get a sound and a notification on your device the moment anything happens with your
              orders, even when the app is closed.
            </p>
          )}
          {!denied && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={busy} onClick={subscribe}>
                Enable notifications
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSnoozed(true)}>
                Later
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
