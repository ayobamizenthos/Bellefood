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

interface NotificationRecord {
  user_id: string
  order_id: string | null
  title: string
  message: string
  type: string
}

Deno.serve(async req => {
  try {
    const body = await req.json()
    const record: NotificationRecord = body.record ?? body
    if (!record?.user_id) return json({ error: 'no user_id' }, 400)

    const [{ data: subscriptions }, { count: unread }] = await Promise.all([
      admin.from('push_subscriptions').select('*').eq('user_id', record.user_id),
      admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', record.user_id)
        .eq('is_read', false),
    ])

    if (!subscriptions?.length) return json({ ok: true, sent: 0, reason: 'no subscriptions' })

    const payload = JSON.stringify({
      title: record.title,
      body: record.message,
      tag: record.order_id ?? record.type,
      url: record.order_id ? `/orders/${record.order_id}` : '/notifications',
      count: unread ?? 0,
    })

    let sent = 0
    const errors: { status?: number; message: string }[] = []

    await Promise.all(
      subscriptions.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
            payload,
            { TTL: 86400, urgency: 'high' }
          )
          sent++
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode
          errors.push({ status, message: (error as Error).message })
          if (status === 404 || status === 410) {
            await admin.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      })
    )

    return json({ ok: sent > 0, sent, failed: errors.length, errors })
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
