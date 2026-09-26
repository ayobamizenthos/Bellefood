import { createClient } from 'npm:@supabase/supabase-js@2'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const encoder = new TextEncoder()

const signingKey = crypto.subtle.importKey(
  'raw',
  encoder.encode(PAYSTACK_SECRET),
  { name: 'HMAC', hash: 'SHA-512' },
  false,
  ['sign']
)

interface ChargeEvent {
  event: string
  data?: {
    reference?: string
    status?: string
    currency?: string
    amount?: number
    metadata?: { orderId?: string } | null
  }
}

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

function constantTimeEqual(expected: string, received: string): boolean {
  if (expected.length !== received.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index)
  }
  return difference === 0
}

async function hasValidSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false
  const digest = await crypto.subtle.sign('HMAC', await signingKey, encoder.encode(rawBody))
  return constantTimeEqual(toHex(digest), signature.toLowerCase())
}

const acknowledge = () => new Response(null, { status: 200 })

/**
 * Paystack's server-to-server confirmation. It settles an order even when the customer closes
 * the tab before the browser can call paystack-verify. Replays are harmless: only a pending
 * order is ever updated.
 */
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response(null, { status: 405 })

  const rawBody = await req.text()
  if (!(await hasValidSignature(rawBody, req.headers.get('x-paystack-signature')))) {
    return new Response(null, { status: 401 })
  }

  try {
    const notice = JSON.parse(rawBody) as ChargeEvent
    const charge = notice.data
    if (notice.event !== 'charge.success' || charge?.status !== 'success') return acknowledge()

    const reference = charge.reference
    const orderId = charge.metadata?.orderId
    if (typeof reference !== 'string' || typeof orderId !== 'string') return acknowledge()

    const { data: order } = await admin
      .from('orders')
      .select('id, total, payment_status')
      .eq('id', orderId)
      .eq('order_number', reference)
      .maybeSingle()
    if (!order || order.payment_status !== 'pending') return acknowledge()

    if (charge.currency !== 'NGN') return acknowledge()
    if (typeof charge.amount !== 'number' || charge.amount < Math.round(Number(order.total) * 100)) {
      return acknowledge()
    }

    const { error } = await admin
      .from('orders')
      .update({
        payment_status: 'verified',
        status: 'processing',
        payment_reference: reference,
        payment_method: 'paystack',
      })
      .eq('id', order.id)
      .eq('payment_status', 'pending')
    // A failed write returns 500 so Paystack retries the event later.
    if (error) return new Response(null, { status: 500 })

    return acknowledge()
  } catch {
    return new Response(null, { status: 500 })
  }
})
