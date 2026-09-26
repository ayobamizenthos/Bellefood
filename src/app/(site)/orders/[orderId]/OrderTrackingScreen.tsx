'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, BadgeCheck, CircleX, MessageCircle } from 'lucide-react'
import { OrderPlacedCelebration } from '@/components/order/OrderPlacedCelebration'
import { OrderReceipt } from '@/components/order/OrderReceipt'
import { StatusTimeline } from '@/components/order/StatusTimeline'
import { useOrder } from '@/hooks/useOrders'
import { useSupportSheet } from '@/stores/support'
import { PAYMENT_STATUS_LABEL, STORE } from '@/lib/constants'
import { orderAddress } from '@/lib/types'
import type { Order } from '@/lib/types'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/Field'
import { cn } from '@/lib/cn'

function celebrationMessage(order: Order, isPickup: boolean): string {
  if (order.payment_status === 'verified') {
    return isPickup
      ? 'We will let you know as soon as it is ready to collect.'
      : 'We are preparing it now and will tell you when it is on its way.'
  }
  return 'We will notify you the moment your payment is confirmed.'
}

export default function OrderTrackingScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { order, log, loading, confirmReceipt } = useOrder(orderId)
  const showSupport = useSupportSheet(state => state.show)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [celebrated, setCelebrated] = useState(false)
  const justPlaced = params.get('placed') === '1' && !celebrated
  const paymentUnconfirmed = params.get('notice') === 'unconfirmed'

  if (loading) return <PageSpinner />
  if (!order) return <p className="py-16 text-center">Order not found.</p>

  const address = orderAddress(order)
  const isPickup = order.delivery_method === 'pickup'
  const cancelled = order.status === 'cancelled'
  const awaitingReceipt =
    order.payment_status === 'verified' &&
    (order.status === 'out_for_delivery' || order.status === 'delivered')

  const closeCelebration = () => {
    setCelebrated(true)
    const kept = new URLSearchParams(params.toString())
    kept.delete('placed')
    const query = kept.toString()
    router.replace(query ? pathname + '?' + query : pathname)
  }

  const confirmArrival = async () => {
    setConfirmError('')
    setConfirming(true)
    const confirmed = await confirmReceipt()
    setConfirming(false)
    if (!confirmed) setConfirmError('We could not record that. Please try again.')
  }

  return (
    <div className="mx-auto flex max-w-app flex-col gap-5">
      {justPlaced && (
        <OrderPlacedCelebration
          orderNumber={order.order_number}
          message={celebrationMessage(order, isPickup)}
          onDismiss={closeCelebration}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">{order.order_number}</h1>
        <p
          className={cn(
            'flex items-center gap-1 text-body',
            order.payment_status === 'verified'
              ? 'text-success'
              : order.payment_status === 'failed'
                ? 'text-danger'
                : 'text-ink-muted'
          )}
        >
          {order.payment_status === 'verified' && <BadgeCheck size={16} />}
          Payment: {PAYMENT_STATUS_LABEL[order.payment_status]}
        </p>
      </div>

      {paymentUnconfirmed && order.payment_status === 'pending' && (
        <p className="rounded-xl bg-brand-tint px-4 py-3 text-body text-brand">
          Your payment went through but is not confirmed yet. We will confirm it shortly; there is
          no need to pay again.
        </p>
      )}

      {cancelled ? (
        <section className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">
          <CircleX size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">This order was cancelled</p>
            {order.cancel_reason && <p className="text-body">{order.cancel_reason}</p>}
            {order.points_redeemed > 0 && (
              <p className="text-body">The points you used are back in your balance.</p>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-4 font-bold">Order Status</h2>
          <StatusTimeline current={order.status} log={log} isPickup={isPickup} />
        </section>
      )}

      {awaitingReceipt && (
        <div className="rounded-2xl border border-brand bg-brand-tint p-4">
          <p className="mb-3 font-semibold text-brand">
            {isPickup ? 'Have you picked up your order?' : 'Has your order arrived?'}
          </p>
          <Button fullWidth loading={confirming} onClick={confirmArrival}>
            {isPickup ? 'Confirm Pickup' : 'Confirm Receipt'}
          </Button>
          <div className="mt-2">
            <FormError message={confirmError} />
          </div>
        </div>
      )}
      {order.status === 'completed' && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-body font-medium text-success">
          {isPickup ? 'Picked up. Thank you!' : 'Delivered. Thank you!'} Your order is complete.
        </p>
      )}

      <OrderReceipt order={order} />

      <section className="rounded-2xl border border-line bg-white p-4 text-body">
        <h2 className="mb-2 font-bold">{isPickup ? 'Pickup' : 'Delivery'}</h2>
        <p className="text-ink-muted">
          {address.fullName}
          <br />
          {isPickup
            ? `Belle Food, ${STORE.address}`
            : [address.street, address.landmark, address.zone].filter(Boolean).join(', ')}
          <br />
          {address.phone}
        </p>
      </section>

      <button
        type="button"
        onClick={showSupport}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line py-3 font-semibold text-ink"
      >
        <MessageCircle size={18} className="text-brand" />
        Need help? Contact support
      </button>

      <Link
        href="/orders"
        className="flex min-h-[44px] items-center justify-center gap-1 text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> All orders
      </Link>
    </div>
  )
}
