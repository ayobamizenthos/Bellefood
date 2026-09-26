import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
  count?: number
}

const APP_NAME = 'Belle Food'
const NOTIFICATION_ICON = '/icons/icon-192.png'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Supabase answers are per user; caching them would replay one account's data to the next.
  runtimeCaching: [
    { matcher: ({ url }) => url.hostname.endsWith('.supabase.co'), handler: new NetworkOnly() },
    ...defaultCache,
  ],
})

serwist.addEventListeners()

function readPayload(event: PushEvent): PushPayload {
  try {
    return (event.data?.json() ?? {}) as PushPayload
  } catch {
    return { title: APP_NAME, body: event.data?.text() ?? '' }
  }
}

self.addEventListener('push', (event: PushEvent) => {
  const payload = readPayload(event)

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title ?? APP_NAME, {
        body: payload.body ?? '',
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        tag: payload.tag,
        data: { url: payload.url ?? '/orders' },
      })
      const badging = self.navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void> }
      await badging.setAppBadge?.(payload.count).catch(() => undefined)
    })()
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const target = (event.notification.data as { url?: string } | null)?.url ?? '/orders'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      const open = windows.find((client): client is WindowClient => 'focus' in client)
      if (open) {
        void open.navigate(target)
        return open.focus()
      }
      return self.clients.openWindow(target)
    })
  )
})
