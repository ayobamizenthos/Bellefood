'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, CheckCircle2, CircleX, FileText, Flag, Package, Truck } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { cancelOrder, updateOrderStatus, updatePaymentStatus } from '@/hooks/useAdmin'
import { supabase } from '@/lib/supabase'
import { playNotification } from '@/lib/sounds'
import { formatDateTime } from '@/lib/format'
import { STORE } from '@/lib/constants'
import type { OrderStatus } from '@/lib/constants'
import { orderAddress } from '@/lib/types'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { StatusPill } from '@/components/order/StatusPill'
import { OrderReceipt } from '@/components/order/OrderReceipt'

const PROOF_LINK_SECONDS = 3600
const IMAGE_PROOF = /\.(png|jpe?g|webp|gif|heic)$/i

function useProofUrl(proofPath: string | null) {
  const [proofUrl, setProofUrl] = useState<string | null>(null)

  useEffect(() => {
    setProofUrl(null)
    if (!proofPath) return
    let active = true
    supabase.storage
      .from('payment-proofs')
      .createSignedUrl(proofPath, PROOF_LINK_SECONDS)
      .then(({ data }) => {
        if (active) setProofUrl(data?.signedUrl ?? null)
      })
    return () => {
      active = false
    }
  }, [proofPath])

  return proofUrl
}

export default function OrderDetailScreen({ orderId }: { orderId: string }) {
  const { order, log, loading, reload } = useOrder(orderId)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const proofPath = order?.payment_proof_url ?? null
  const proofUrl = useProofUrl(proofPath)

  if (loading) return <PageSpinner />
  if (!order) return <p className="py-16 text-center">Order not found.</p>

  const address = orderAddress(order)
  const isPickup = order.delivery_method === 'pickup'
  const isImageProof = IMAGE_PROOF.test(proofPath ?? '')
  const completedAt = log.find(entry => entry.status === 'completed')?.created_at
  const closed = order.status === 'completed' || order.status === 'cancelled'

  const applyChange = async (change: () => PromiseLike<{ error: { message: string } | null }>) => {
    setActionError('')
    setBusy(true)
    const { error } = await change()
    await reload()
    setBusy(false)
    if (error) {
      setActionError('That change could not be saved. Please try again.')
      return false
    }
    playNotification()
    return true
  }

  const advance = (status: OrderStatus) => applyChange(() => updateOrderStatus(order.id, status))

  const confirmCancel = async () => {
    const cancelled = await applyChange(() => cancelOrder(order.id, cancelReason))
    if (cancelled) {
      setCancelling(false)
      setCancelReason('')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/orders"
        className="flex min-h-[44px] items-center gap-1 self-start text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-body text-ink-muted">Placed {formatDateTime(order.created_at)}</p>
          {completedAt && (
            <p className="text-body text-success">Completed {formatDateTime(completedAt)}</p>
          )}
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <OrderReceipt order={order} />

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 font-bold">Status History</h2>
            {log.length === 0 ? (
              <p className="text-body text-ink-muted">No status changes yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {log.map(entry => (
                  <li key={entry.id} className="flex flex-col gap-1 text-body">
                    <span className="flex justify-between">
                      <StatusPill status={entry.status} />
                      <span className="text-ink-muted">{formatDateTime(entry.created_at)}</span>
                    </span>
                    {entry.admin_notes && <span className="text-ink-muted">{entry.admin_notes}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-white p-4 text-body">
            <h2 className="mb-2 font-bold">Customer</h2>
            <p className="font-semibold">{address.fullName}</p>
            <p className="text-ink-muted">{address.phone}</p>
            <span className="mt-1 inline-flex rounded-full bg-brand-tint px-2 py-0.5 text-label font-semibold text-brand">
              {isPickup ? 'Pickup' : 'Delivery'}
            </span>
            <p className="mt-1 text-ink-muted">
              {isPickup
                ? `Collecting at ${STORE.address}`
                : [address.street, address.landmark, address.zone].filter(Boolean).join(', ')}
            </p>
            {order.customer_note && (
              <div className="mt-3 rounded-lg bg-brand-tint px-3 py-2">
                <p className="text-label font-semibold text-brand">Customer note</p>
                <p className="text-ink">{order.customer_note}</p>
              </div>
            )}
            {proofPath && (
              <div className="mt-3">
                <p className="mb-1 text-label font-semibold text-ink-muted">Proof of payment</p>
                {!proofUrl ? (
                  <p className="text-body text-ink-muted">Loading…</p>
                ) : isImageProof ? (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="block">
                    <Image
                      src={proofUrl}
                      alt="Proof of payment"
                      width={600}
                      height={400}
                      className="max-h-72 w-full rounded-xl border border-line object-contain"
                    />
                  </a>
                ) : (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-line p-3 font-semibold text-brand"
                  >
                    <FileText size={18} /> Open uploaded proof
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-1 font-bold">Actions</h2>

            {order.status === 'cancelled' ? (
              <p className="flex items-center gap-2 text-body text-danger">
                <CircleX size={16} /> Order cancelled
                {order.points_redeemed > 0 && ', points returned to the customer'}
              </p>
            ) : order.payment_status !== 'verified' ? (
              <>
                <div className="rounded-lg bg-brand-tint px-3 py-2 text-body text-brand">
                  Payment pending verification.
                  {order.bank_reference && (
                    <>
                      {' '}
                      Ref: <span className="font-semibold">{order.bank_reference}</span>
                    </>
                  )}
                </div>
                <Button
                  fullWidth
                  loading={busy}
                  onClick={() => applyChange(() => updatePaymentStatus(order.id, 'verified'))}
                >
                  <BadgeCheck size={18} /> Confirm Payment
                </Button>
              </>
            ) : (
              <>
                <p className="mb-1 flex items-center gap-1 text-body text-success">
                  <BadgeCheck size={16} /> Payment verified
                </p>
                <ActionButton
                  show={order.status === 'processing'}
                  busy={busy}
                  icon={<Truck size={18} />}
                  label={isPickup ? 'Mark Ready for Pickup' : 'Mark Out for Delivery'}
                  onClick={() => advance('out_for_delivery')}
                />
                <ActionButton
                  show={order.status === 'out_for_delivery' || order.status === 'delivered'}
                  busy={busy}
                  icon={<Flag size={18} />}
                  label="Mark as Completed"
                  onClick={() => advance('completed')}
                />
                {order.status === 'completed' && (
                  <p className="flex items-center gap-2 text-body text-success">
                    {order.receipt_confirmed ? <CheckCircle2 size={16} /> : <Package size={16} />}
                    {order.receipt_confirmed
                      ? isPickup
                        ? 'Customer confirmed pickup'
                        : 'Customer confirmed receipt'
                      : 'Order complete'}
                  </p>
                )}
              </>
            )}

            {!closed &&
              (cancelling ? (
                <div className="mt-2 flex flex-col gap-2 rounded-xl border border-danger/30 p-3">
                  <Field label="Reason shown to the customer" hint="For example: the transfer receipt could not be matched.">
                    <textarea
                      value={cancelReason}
                      onChange={event => setCancelReason(event.target.value)}
                      rows={2}
                      maxLength={300}
                      className="w-full rounded-xl border border-line bg-white p-3 text-body outline-none focus:border-brand"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setCancelling(false)}>
                      Keep order
                    </Button>
                    <Button variant="danger" className="flex-1" loading={busy} onClick={confirmCancel}>
                      Cancel order
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" fullWidth className="mt-2 text-danger" onClick={() => setCancelling(true)}>
                  <CircleX size={18} /> Cancel or reject order
                </Button>
              ))}

            <FormError message={actionError} />
          </section>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  show,
  busy,
  icon,
  label,
  onClick,
}: {
  show: boolean
  busy: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  if (!show) return null
  return (
    <Button fullWidth loading={busy} onClick={onClick}>
      {icon} {label}
    </Button>
  )
}
