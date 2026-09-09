'use client'

import { Bell } from 'lucide-react'
import { usePreferences } from '@/stores/preferences'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

export function AlertsToggle() {
  const alertsEnabled = usePreferences(s => s.alertsEnabled)
  const setAlerts = usePreferences(s => s.setAlerts)
  const { supported, state, subscribe, unsubscribe } = usePushNotifications()

  const handleChange = (enabled: boolean) => {
    setAlerts(enabled)
    if (!supported) return
    if (enabled) void subscribe()
    else void unsubscribe()
  }

  const blocked = supported && state === 'denied'

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
      <span className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand">
          <Bell size={18} />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">Order alerts</span>
          <span className="block text-label text-ink-muted">
            {blocked
              ? 'Blocked in your browser settings. Allow notifications for this site to receive them.'
              : 'A sound and a notification on your device for every order update.'}
          </span>
        </span>
      </span>
      <ToggleSwitch checked={alertsEnabled} onChange={handleChange} label="Order alerts" />
    </div>
  )
}
