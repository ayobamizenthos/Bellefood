import { createClient } from 'npm:@supabase/supabase-js@2'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(token ?? '')
    if (!auth.user) return reply(401, { ok: false, error: 'sign in required' })

    const { reference, orderId } = await req.json()
    if (typeof reference !== 'string' || typeof orderId !== 'string') {
      return reply(400, { ok: false, error: 'missing reference or order' })
    }

    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, total, payment_status')
      .eq('id', orderId)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (!order) return reply(404, { ok: false, error: 'order not found' })
    if (order.payment_status === 'verified') return reply(200, { ok: true })

    // Each attempt is charged as ORDER_NUMBER-attempt, so a receipt for one order
    // can never be presented against another.
    if (reference !== order.order_number && !reference.startsWith(order.order_number + '-')) {
      return reply(400, { ok: false, error: 'reference does not match order' })
    }

    const verify = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    })
    const payload = await verify.json()
    const charge = payload.data
    if (!payload.status || charge?.status !== 'success') return reply(400, { ok: false, error: 'payment not successful' })
    if (charge.currency !== 'NGN' || charge.metadata?.orderId !== order.id) {
      return reply(400, { ok: false, error: 'payment does not match order' })
    }
    if (charge.amount < Math.round(Number(order.total) * 100)) return reply(400, { ok: false, error: 'amount mismatch' })

    await admin
      .from('orders')
      .update({
        payment_status: 'verified',
        status: 'processing',
        payment_reference: reference,
        payment_method: 'paystack',
      })
      .eq('id', order.id)
      .eq('payment_status', 'pending')

    return reply(200, { ok: true })
  } catch {
    return reply(500, { ok: false, error: 'could not verify payment' })
  }
})
