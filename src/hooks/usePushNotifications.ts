import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
  'BJ0gSPvFQYkKiQaHlcD6TXO0wHsqMzkhAB0-S6Sr-LYuUe3MmDr9M-ZKQQK1PCwi7jU9vV5eS4l1XtnWgx9Pzrw'

type PushState = 'unsupported' | 'default' | 'granted' | 'denied'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function usePushNotifications() {
  const { session } = useAuth()
  const supported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const [state, setState] = useState<PushState>(supported ? 'default' : 'unsupported')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (supported) setState(Notification.permission as PushState)
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!supported || !session) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      setState(permission as PushState)
      if (permission !== 'granted' || !VAPID_PUBLIC_KEY) return

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }))

      const json = subscription.toJSON()
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: session.user.id,
          endpoint: subscription.endpoint,
          p256dh_key: json.keys?.p256dh ?? '',
          auth_key: json.keys?.auth ?? '',
        },
        { onConflict: 'user_id,endpoint' }
      )
    } catch {
      setState(Notification.permission as PushState)
    } finally {
      setBusy(false)
    }
  }, [supported, session])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
        await subscription.unsubscribe()
      }
    } catch {
      // best effort — the alerts preference still mutes in-app sound and toasts
    } finally {
      setBusy(false)
    }
  }, [supported])

  return { supported, state, busy, subscribe, unsubscribe, enabled: state === 'granted' }
}
