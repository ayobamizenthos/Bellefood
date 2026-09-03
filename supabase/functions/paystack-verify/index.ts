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

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { reference, orderId } = await req.json()
    if (!reference || !orderId) {
      return new Response(JSON.stringify({ ok: false, error: 'missing reference or orderId' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    })
    const payload = await verify.json()

    if (!payload.status || payload.data?.status !== 'success') {
      return new Response(JSON.stringify({ ok: false, error: 'payment not successful' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const { data: order } = await admin
      .from('orders')
      .select('id, total, payment_status')
      .eq('id', orderId)
      .single()

    if (!order) {
      return new Response(JSON.stringify({ ok: false, error: 'order not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (payload.data.amount < Math.round(Number(order.total) * 100)) {
      return new Response(JSON.stringify({ ok: false, error: 'amount mismatch' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (order.payment_status !== 'verified') {
      await admin
        .from('orders')
        .update({
          payment_status: 'verified',
          status: 'processing',
          payment_reference: reference,
          payment_method: 'paystack',
        })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
