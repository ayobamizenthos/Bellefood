'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Link, useParams } from '@/lib/router'
import { ArrowLeft, BadgeCheck, Package, Truck, CheckCircle2, Flag, FileText } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { updateOrderStatus, updatePaymentStatus } from '@/hooks/useAdmin'
import { supabase } from '@/lib/supabase'
import { playNotification } from '@/lib/sounds'
import { formatDateTime, formatNaira } from '@/lib/format'
import type { OrderStatus } from '@/lib/constants'
import type { CartItem } from '@/lib/types'
import { cartItemTotal } from '@/lib/types'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/admin/StatusPill'

export default function AdminOrderDetail() {
  const { orderId } = useParams()
  const { order, log, loading, reload } = useOrder(orderId)
  const [busy, setBusy] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)

  const proofPath = order?.payment_proof_url ?? null
  useEffect(() => {
    if (!proofPath) {
      setProofUrl(null)
      return
    }
    supabase.storage
      .from('payment-proofs')
      .createSignedUrl(proofPath, 3600)
      .then(({ data }) => setProofUrl(data?.signedUrl ?? null))
  }, [proofPath])

  if (loading) return <PageSpinner />
  if (!order) return <p className="py-16 text-center">Order not found.</p>

  const items = order.items as unknown as CartItem[]
  const address = order.delivery_address as {
    method?: string
    fullName?: string
    phone?: string
    street?: string
    landmark?: string
    zone?: string
    location?: string
  }

  const isImageProof = /\.(png|jpe?g|webp|gif|heic)$/i.test(proofPath ?? '')

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    await fn()
    await reload()
    setBusy(false)
    playNotification()
  }

  const advance = (status: OrderStatus) => run(() => updateOrderStatus(order.id, status))

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/admin/orders"
        className="flex items-center gap-1 text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-body text-ink-muted">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 font-bold">Items</h2>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-body">
                  <span className="text-ink-muted">
                    {item.name}
                    {` × ${item.quantity}`}
                  </span>
                  <span className="font-semibold">{formatNaira(cartItemTotal(item))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-body">
              <Row label="Subtotal" value={formatNaira(order.subtotal)} />
              <Row
                label="Delivery"
                value={order.delivery_fee === 0 ? 'Free' : formatNaira(order.delivery_fee)}
              />
              <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-brand">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 font-bold">Status History</h2>
            {log.length === 0 ? (
              <p className="text-body text-ink-muted">No status changes yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {log.map(entry => (
                  <li key={entry.id} className="flex justify-between text-body">
                    <StatusPill status={entry.status} />
                    <span className="text-ink-muted">{formatDateTime(entry.created_at)}</span>
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
            <span className="mt-1 inline-flex rounded-full bg-brand-tint px-2 py-0.5 text-label font-semibold capitalize text-brand">
              {address.method === 'pickup' ? 'Pickup' : 'Delivery'}
            </span>
            <p className="mt-1 text-ink-muted">
              {address.method === 'pickup'
                ? address.location
                : [address.street, address.landmark, address.zone].filter(Boolean).join(', ')}
            </p>
            {order.customer_note && (
              <div className="mt-3 rounded-lg bg-brand-tint px-3 py-2">
                <p className="text-label font-semibold text-brand">Customer note</p>
                <p className="text-ink">{order.customer_note}</p>
              </div>
            )}
            {order.payment_proof_url && (
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

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 font-bold">Actions</h2>

            {order.payment_status !== 'verified' ? (
              <div className="flex flex-col gap-3">
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
                  onClick={() => run(() => updatePaymentStatus(order.id, 'verified'))}
                >
                  <BadgeCheck size={18} /> Confirm Payment
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="mb-1 text-body text-success">Payment verified ✓</p>
                <ActionButton
                  show={order.status === 'processing'}
                  busy={busy}
                  icon={<Truck size={18} />}
                  label="Mark Out for Delivery"
                  onClick={() => advance('out_for_delivery')}
                />
                <ActionButton
                  show={order.status === 'out_for_delivery'}
                  busy={busy}
                  disabled={!order.receipt_confirmed}
                  icon={<CheckCircle2 size={18} />}
                  label={
                    order.receipt_confirmed ? 'Confirm Delivered' : 'Awaiting customer receipt'
                  }
                  onClick={() => advance('delivered')}
                />
                <ActionButton
                  show={order.status === 'delivered'}
                  busy={busy}
                  icon={<Flag size={18} />}
                  label="Mark as Completed"
                  onClick={() => advance('completed')}
                />
                {order.status === 'completed' && (
                  <p className="flex items-center gap-2 text-body text-success">
                    <Package size={16} /> Order complete
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  show,
  busy,
  disabled,
  icon,
  label,
  onClick,
}: {
  show: boolean
  busy: boolean
  disabled?: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  if (!show) return null
  return (
    <Button fullWidth loading={busy} disabled={disabled} onClick={onClick}>
      {icon} {label}
    </Button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
