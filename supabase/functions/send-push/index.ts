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

const BATCH = 200

interface Pending {
  id: string
  user_id: string
  order_id: string | null
  title: string
  message: string
  type: string
}

interface Device {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
}

/**
 * Sends every notification that has not reached a phone yet.
 *
 * The queue is the notifications table itself: a row with no pushed_at is still
 * outstanding. That is what makes an unreachable device harmless - the row stays
 * unstamped, and the next run delivers it. Stamping is what stops anyone being
 * handed the same alert twice.
 *
 * The request body is ignored. The database calls this on every insert, and it
 * is safe to call on a timer as a backstop, because it only ever picks up what
 * is still outstanding.
 */
Deno.serve(async () => {
  try {
    const { data: pending } = await admin
      .from('notifications')
      .select('id, user_id, order_id, title, message, type')
      .is('pushed_at', null)
      .order('created_at', { ascending: true })
      .limit(BATCH)

    const queue = (pending ?? []) as Pending[]
    if (queue.length === 0) return json({ sent: 0, handled: 0 })

    const recipients = [...new Set(queue.map(row => row.user_id))]

    const [{ data: devices }, { data: unreadRows }] = await Promise.all([
      admin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh_key, auth_key')
        .in('user_id', recipients),
      admin
        .from('notifications')
        .select('user_id')
        .in('user_id', recipients)
        .eq('is_read', false),
    ])

    const byUser = new Map<string, Device[]>()
    for (const device of (devices ?? []) as Device[]) {
      const list = byUser.get(device.user_id)
      if (list) list.push(device)
      else byUser.set(device.user_id, [device])
    }

    const unread = new Map<string, number>()
    for (const row of (unreadRows ?? []) as { user_id: string }[]) {
      unread.set(row.user_id, (unread.get(row.user_id) ?? 0) + 1)
    }

    const delivered: string[] = []
    const dead: string[] = []
    let sent = 0

    for (const row of queue) {
      const targets = byUser.get(row.user_id) ?? []
      // Nobody registered a device. The alert still sits in the in-app inbox, so
      // it is marked handled rather than retried on every run forever.
      if (targets.length === 0) {
        delivered.push(row.id)
        continue
      }

      const payload = JSON.stringify({
        title: row.title,
        body: row.message,
        tag: row.order_id ?? row.type,
        url: row.order_id ? `/orders/${row.order_id}` : '/notifications',
        count: unread.get(row.user_id) ?? 0,
      })

      const results = await Promise.allSettled(
        targets.map(device =>
          webpush.sendNotification(
            {
              endpoint: device.endpoint,
              keys: { p256dh: device.p256dh_key, auth: device.auth_key },
            },
            payload,
            { TTL: 86400, urgency: 'high' }
          )
        )
      )

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          sent += 1
          return
        }
        const status = (result.reason as { statusCode?: number })?.statusCode
        // 404 and 410 mean the browser threw this subscription away
        if (status === 404 || status === 410) dead.push(targets[index].id)
      })

      delivered.push(row.id)
    }

    if (delivered.length > 0) {
      await admin
        .from('notifications')
        .update({ pushed_at: new Date().toISOString() })
        .in('id', delivered)
    }
    if (dead.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', dead)
    }

    return json({ sent, handled: delivered.length, pruned: dead.length })
  } catch (error) {
    return json({ error: (error as Error).message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
