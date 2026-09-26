import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@bellefood.ng'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BATCH_SIZE = 200
// The longest push services will hold an alert for a phone that is offline.
const FOUR_WEEKS_SECONDS = 60 * 60 * 24 * 28
const GONE_STATUSES = new Set([404, 410])

interface PendingAlert {
  id: string
  user_id: string
  order_id: string | null
  title: string
  message: string
  type: string
  created_at: string
}

interface Device {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const pushStatus = (reason: unknown): number | undefined =>
  typeof reason === 'object' && reason !== null && 'statusCode' in reason
    ? Number((reason as { statusCode: unknown }).statusCode)
    : undefined

/**
 * Drains notifications that have not reached a device yet. The request body is ignored: the
 * database calls this on every insert, and running it again only picks up what is outstanding.
 */
Deno.serve(async () => {
  try {
    const { data: claimed, error: claimError } = await admin.rpc('claim_push_batch', {
      p_limit: BATCH_SIZE,
    })
    if (claimError) throw claimError

    const queue = (claimed ?? []) as PendingAlert[]
    if (queue.length === 0) return json({ sent: 0, settled: 0 })

    const recipients = [...new Set(queue.map(alert => alert.user_id))]

    const [{ data: devices, error: devicesError }, { data: unreadRows, error: unreadError }] = await Promise.all([
      admin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh_key, auth_key')
        .in('user_id', recipients),
      admin.from('notifications').select('user_id').in('user_id', recipients).eq('is_read', false),
    ])
    // Without the device list every alert would look undeliverable and be marked
    // sent; failing here lets the claim lapse so a later run tries again.
    if (devicesError) throw devicesError
    if (unreadError) throw unreadError

    const devicesByUser = new Map<string, Device[]>()
    for (const device of (devices ?? []) as Device[]) {
      devicesByUser.set(device.user_id, [...(devicesByUser.get(device.user_id) ?? []), device])
    }

    const unreadByUser = new Map<string, number>()
    for (const row of (unreadRows ?? []) as { user_id: string }[]) {
      unreadByUser.set(row.user_id, (unreadByUser.get(row.user_id) ?? 0) + 1)
    }

    const settled: string[] = []
    const goneDevices = new Set<string>()
    const expiredBefore = Date.now() - FOUR_WEEKS_SECONDS * 1000
    let sent = 0

    for (const alert of queue) {
      const targets = (devicesByUser.get(alert.user_id) ?? []).filter(device => !goneDevices.has(device.id))
      // With no device the alert lives only in the in-app inbox, so there is nothing to retry.
      if (targets.length === 0) {
        settled.push(alert.id)
        continue
      }

      const payload = JSON.stringify({
        title: alert.title,
        body: alert.message,
        tag: alert.order_id ?? alert.type,
        url: alert.order_id ? `/orders/${alert.order_id}` : '/notifications',
        count: unreadByUser.get(alert.user_id) ?? 0,
      })

      const outcomes = await Promise.allSettled(
        targets.map(device =>
          webpush.sendNotification(
            { endpoint: device.endpoint, keys: { p256dh: device.p256dh_key, auth: device.auth_key } },
            payload,
            { TTL: FOUR_WEEKS_SECONDS, urgency: 'high' }
          )
        )
      )

      let accepted = false
      let retryable = false
      outcomes.forEach((outcome, index) => {
        if (outcome.status === 'fulfilled') {
          accepted = true
          sent += 1
          return
        }
        const status = pushStatus(outcome.reason)
        if (status !== undefined && GONE_STATUSES.has(status)) goneDevices.add(targets[index].id)
        else retryable = true
      })

      const expired = new Date(alert.created_at).getTime() < expiredBefore
      if (accepted || !retryable || expired) settled.push(alert.id)
    }

    if (settled.length > 0) {
      await admin.from('notifications').update({ pushed_at: new Date().toISOString() }).in('id', settled)
    }
    if (goneDevices.size > 0) {
      await admin.from('push_subscriptions').delete().in('id', [...goneDevices])
    }

    return json({ sent, settled: settled.length, pruned: goneDevices.size })
  } catch {
    return json({ error: 'push delivery failed' }, 500)
  }
})
