import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import { useAuth } from '@/stores/auth'

type PushState = 'unsupported' | NotificationPermission

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index)
  return output
}

const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

export function usePushNotifications() {
  const { userId } = useAuth()
  const [supported, setSupported] = useState(false)
  const [state, setState] = useState<PushState>('unsupported')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const available = pushSupported()
    setSupported(available)
    setState(available ? Notification.permission : 'unsupported')
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported || !userId) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      setState(permission)
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
        }))

      const keys = subscription.toJSON().keys
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: keys?.p256dh ?? '',
          auth_key: keys?.auth ?? '',
        },
        { onConflict: 'user_id,endpoint' }
      )
    } catch {
      setState(Notification.permission)
    } finally {
      setBusy(false)
    }
  }, [supported, userId])

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
      setState(Notification.permission)
    } finally {
      setBusy(false)
    }
  }, [supported])

  return { supported, state, busy, subscribe, unsubscribe }
}
