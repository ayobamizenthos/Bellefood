import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@zenthosenergies.com'

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
    if (!record?.user_id) return new Response('no record', { status: 400 })

    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', record.user_id)

    if (!subscriptions?.length) return new Response('no subscriptions', { status: 200 })

    const payload = JSON.stringify({
      title: record.title,
      body: record.message,
      tag: record.order_id ?? record.type,
      url: record.order_id ? `/orders/${record.order_id}` : '/notifications',
    })

    await Promise.all(
      subscriptions.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
            payload
          )
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      })
    )

    return new Response('sent', { status: 200 })
  } catch (error) {
    return new Response(`error: ${(error as Error).message}`, { status: 500 })
  }
})
