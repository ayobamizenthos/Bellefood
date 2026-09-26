'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bike,
  Building2,
  Check,
  Copy,
  CreditCard,
  ImageUp,
  Loader2,
  MapPin,
  Sparkles,
  Store,
  X,
} from 'lucide-react'
import { useCart } from '@/stores/cart'
import { useAuth } from '@/stores/auth'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { supabase } from '@/lib/supabase'
import { calculateTotals, kitchenSubtotal, redeemPoints } from '@/lib/pricing'
import type { OrderTotals } from '@/lib/pricing'
import type { FulfilmentMethod } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { copyToClipboard } from '@/lib/text'
import { payWithPaystack } from '@/lib/paystack'
import { STORE } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { SummaryRow, deliveryFeeLabel, rewardsDiscountLabel } from '@/components/order/OrderReceipt'

type Step = 1 | 2
type PaymentMethod = 'paystack' | 'bank_transfer'

interface PlacedOrder {
  id: string
  order_number: string
  total: number
  payment_status: string
}

const COPIED_FEEDBACK_MS = 1500

/** Order page URL; `notice` carries a message the order page shows once the celebration closes. */
const placedOrderPath = (orderId: string, notice?: 'unconfirmed') =>
  `/orders/${orderId}?placed=1${notice ? `&notice=${notice}` : ''}`

export default function CheckoutScreen() {
  const router = useRouter()
  const items = useCart(state => state.items)
  const clearCart = useCart(state => state.clear)
  const { session, userId, profile } = useAuth()
  const { points, settings: loyalty } = useLoyalty()
  const { settings, loading } = useStoreSettings()
  const { zones } = useDeliveryZones()

  const [step, setStep] = useState<Step>(1)
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('delivery')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [landmark, setLandmark] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('paystack')
  const [bankReference, setBankReference] = useState('')
  const [proofPath, setProofPath] = useState('')
  const [proofName, setProofName] = useState('')
  const [proofUploading, setProofUploading] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [usePoints, setUsePoints] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const leavingForOrder = useRef(false)
  const prefilled = useRef(false)

  useEffect(() => {
    if (prefilled.current || !userId || !profile) return
    prefilled.current = true
    setFullName(current => current || profile.full_name || '')
    setPhone(current => current || profile.phone || '')
    supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()
      .then(({ data: address }) => {
        if (!address) return
        setFullName(current => current || address.full_name)
        setPhone(current => current || address.phone)
        setStreet(current => current || address.street)
        if (address.zone_id) setZoneId(address.zone_id)
      })
  }, [userId, profile])

  useEffect(() => {
    if (zones.length === 0) return
    if (!zones.some(zone => zone.id === zoneId)) setZoneId(zones[0].id)
  }, [zones, zoneId])

  useEffect(() => {
    if (!loading && items.length === 0 && !leavingForOrder.current) router.replace('/cart')
  }, [loading, items.length, router])

  if (loading) return <PageSpinner />
  if (items.length === 0) return null

  const bankDetailsReady = Boolean(
    settings?.bank_name && settings.bank_account_number && settings.bank_account_name
  )
  const selectedZone = zones.find(zone => zone.id === zoneId)
  const deliveryFee = fulfilment === 'pickup' ? 0 : Number(selectedZone?.fee ?? 0)
  const totals = calculateTotals(items, deliveryFee, Number(settings?.free_delivery_threshold ?? Infinity))
  const pointsEligible = kitchenSubtotal(items) + totals.deliveryFee
  const available = redeemPoints(points, loyalty.naira_per_point, pointsEligible)
  const pointsDiscount = usePoints ? available.discount : 0
  const payable = Math.max(0, totals.total - pointsDiscount)
  const coveredByPoints = payable === 0

  const contactReady = fullName.trim().length > 1 && phone.trim().length > 6
  const detailsReady =
    fulfilment === 'pickup' ? contactReady : contactReady && street.trim().length > 0 && Boolean(zoneId)
  const needsProof = method === 'bank_transfer' && !coveredByPoints
  const canPlaceOrder = !needsProof || Boolean(proofPath)

  const uploadProof = async (file: File) => {
    if (!userId) return
    setError('')
    setProofUploading(true)
    const extension = file.name.split('.').pop() || 'png'
    const path = `${userId}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, { upsert: true, contentType: file.type })
    setProofUploading(false)
    if (uploadError) {
      setError('Your proof of payment could not be uploaded. Please try again.')
      return
    }
    setProofPath(path)
    setProofName(file.name)
  }

  const clearProof = () => {
    setProofPath('')
    setProofName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const copyAccountNumber = async () => {
    if (!settings?.bank_account_number) return
    if (!(await copyToClipboard(settings.bank_account_number))) return
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  const openOrder = (orderId: string, notice?: 'unconfirmed') => {
    leavingForOrder.current = true
    router.replace(placedOrderPath(orderId, notice))
    clearCart()
  }

  const createOrder = async (): Promise<PlacedOrder | null> => {
    const { data, error: placeError } = await supabase.rpc('place_order', {
      p_items: items.map(item => ({ product_id: item.productId, quantity: item.quantity })),
      p_delivery_method: fulfilment,
      p_zone_id: fulfilment === 'delivery' ? zoneId : undefined,
      p_payment_method: method,
      p_points: usePoints ? points : 0,
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
      p_street: fulfilment === 'delivery' ? street.trim() : undefined,
      p_landmark: fulfilment === 'delivery' ? landmark.trim() || undefined : undefined,
      p_note: note.trim() || undefined,
      p_bank_reference: method === 'bank_transfer' ? bankReference.trim() || undefined : undefined,
      p_payment_proof_url: method === 'bank_transfer' ? proofPath || undefined : undefined,
    })
    if (placeError || !data) return null
    // place_order returns this exact object; the generated types only know it as Json.
    return data as unknown as PlacedOrder
  }

  const payForOrder = async (order: PlacedOrder) => {
    const receipt = await payWithPaystack({
      email: session?.user.email ?? '',
      amountNaira: Number(order.total),
      reference: order.order_number,
      orderId: order.id,
    })
    if (!receipt) {
      setError('Payment was cancelled. Your order is saved, so you can try paying again.')
      return
    }
    const { data: verification } = await supabase.functions.invoke<{ ok: boolean }>('paystack-verify', {
      body: { reference: receipt.reference, orderId: order.id },
    })
    openOrder(order.id, verification?.ok ? undefined : 'unconfirmed')
  }

  const placeOrder = async () => {
    setError('')
    setPlacing(true)
    try {
      const order = placedOrder ?? (await createOrder())
      if (!order) {
        setError('Could not create your order. Please check your details and try again.')
        return
      }
      setPlacedOrder(order)
      if (order.payment_status === 'verified' || method === 'bank_transfer') {
        openOrder(order.id)
        return
      }
      await payForOrder(order)
    } catch {
      setError('Payment could not start. Please try again or pay by bank transfer.')
    } finally {
      setPlacing(false)
    }
  }

  const payButtonLabel = coveredByPoints
    ? 'Place order'
    : placedOrder
      ? `Retry payment of ${formatNaira(Number(placedOrder.total))}`
      : method === 'paystack'
        ? `Pay ${formatNaira(payable)}`
        : 'I have made the transfer'

  return (
    <div className="mx-auto flex max-w-app flex-col gap-5">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">How would you like your order?</h1>

          <div className="grid grid-cols-2 gap-3">
            <FulfilmentCard
              active={fulfilment === 'delivery'}
              onSelect={() => setFulfilment('delivery')}
              icon={<Bike size={22} />}
              title="Delivery"
              subtitle="To your address"
            />
            <FulfilmentCard
              active={fulfilment === 'pickup'}
              onSelect={() => setFulfilment('pickup')}
              icon={<Store size={22} />}
              title="Pickup"
              subtitle="Collect at our store"
            />
          </div>

          <Field label="Full Name">
            <input
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              autoComplete="name"
              className="input"
            />
          </Field>
          <Field label="Phone Number">
            <input
              type="tel"
              value={phone}
              onChange={event => setPhone(event.target.value)}
              autoComplete="tel"
              className="input"
            />
          </Field>

          {fulfilment === 'delivery' ? (
            <>
              <Field label="Delivery Area">
                <select value={zoneId} onChange={event => setZoneId(event.target.value)} className="input">
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({formatNaira(Number(zone.fee))})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Street Address">
                <input
                  value={street}
                  onChange={event => setStreet(event.target.value)}
                  autoComplete="street-address"
                  className="input"
                />
              </Field>
              <Field label="Landmark (optional)">
                <input
                  value={landmark}
                  onChange={event => setLandmark(event.target.value)}
                  placeholder="Nearest bus stop or building"
                  className="input"
                />
              </Field>
            </>
          ) : (
            <PickupNotice />
          )}

          <Field label="Note for the kitchen (optional)">
            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Extra instructions, allergies, or anything we should know"
              className="w-full rounded-xl border border-line bg-white p-3 text-body outline-none focus:border-brand"
            />
          </Field>

          <Button size="lg" fullWidth disabled={!detailsReady} onClick={() => setStep(2)}>
            Continue to Payment
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">Payment</h1>

          {placedOrder && (
            <p className="rounded-xl bg-brand-tint px-4 py-3 text-body text-brand">
              Order {placedOrder.order_number} is saved. Retrying uses the same order, so you are
              never charged twice.
            </p>
          )}

          {!coveredByPoints && (
            <div className="flex flex-col gap-2">
              <PaymentOption
                active={method === 'paystack'}
                disabled={Boolean(placedOrder)}
                onSelect={() => setMethod('paystack')}
                icon={<CreditCard size={20} />}
                title="Pay Now (Card, Transfer, USSD)"
                detail="Secure payment via Paystack. Confirmed as soon as payment succeeds."
              />
              <PaymentOption
                active={method === 'bank_transfer'}
                disabled={Boolean(placedOrder) || !bankDetailsReady}
                onSelect={() => setMethod('bank_transfer')}
                icon={<Building2 size={20} />}
                title="Direct Bank Transfer"
                detail={
                  bankDetailsReady
                    ? 'Transfer manually and upload your proof of payment.'
                    : 'Bank transfer is unavailable right now. Please pay online.'
                }
              />
            </div>
          )}

          {needsProof && settings && (
            <>
              <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center gap-2 text-brand">
                  <Building2 size={20} />
                  <span className="font-semibold">Transfer to:</span>
                </div>
                <Detail label="Account Name" value={settings.bank_account_name ?? ''} />
                <Detail label="Bank" value={settings.bank_name ?? ''} />
                <div className="flex items-center justify-between">
                  <Detail label="Account Number" value={settings.bank_account_number ?? ''} />
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="flex min-h-[44px] items-center gap-1 px-2 text-body font-semibold text-brand"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <span className="font-semibold">Amount to transfer</span>
                  <span className="text-2xl font-bold text-brand">{formatNaira(payable)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="mb-1 font-semibold">
                  Upload proof of payment <span className="text-danger">*</span>
                </p>
                <p className="mb-3 text-body text-ink-muted">
                  A screenshot, photo, or PDF of your transfer is required to place the order.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  aria-label="Proof of payment"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) void uploadProof(file)
                  }}
                />

                {proofPath ? (
                  <div className="mb-3 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 pl-3">
                    <Check size={18} className="shrink-0 text-success" />
                    <span className="min-w-0 flex-1 truncate text-body font-medium">{proofName}</span>
                    <button
                      type="button"
                      onClick={clearProof}
                      aria-label="Remove file"
                      className="grid h-11 w-11 shrink-0 place-items-center text-ink-muted"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={proofUploading}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/50 bg-brand-tint/60 py-4 font-semibold text-brand"
                  >
                    {proofUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <ImageUp size={18} /> Upload proof of payment
                      </>
                    )}
                  </button>
                )}

                <Field label="Transfer reference (optional)">
                  <input
                    value={bankReference}
                    onChange={event => setBankReference(event.target.value)}
                    placeholder="Your name or transaction ID"
                    maxLength={80}
                    className="input"
                  />
                </Field>
              </div>
            </>
          )}

          <div className="rounded-xl bg-brand-tint px-4 py-3 text-body text-brand">
            {coveredByPoints
              ? 'Your points cover this order, so there is nothing to pay.'
              : method === 'paystack'
                ? 'A secure Paystack window opens next. Your order is confirmed as soon as payment succeeds.'
                : 'Your order will be confirmed once we verify your payment, usually within a few minutes.'}
          </div>

          {available.discount > 0 && !placedOrder && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
                usePoints ? 'border-brand bg-brand-tint' : 'border-line'
              )}
            >
              <span className="text-brand">
                <Sparkles size={20} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">Use Belle Rewards</p>
                <p className="text-body text-ink-muted">
                  {points.toLocaleString()} points available: {formatNaira(available.discount)} off
                  food &amp; delivery.
                </p>
              </div>
              <ToggleSwitch checked={usePoints} onChange={setUsePoints} label="Use Belle Rewards points" />
            </div>
          )}

          <OrderSummary
            totals={totals}
            fulfilment={fulfilment}
            zoneName={selectedZone?.name ?? ''}
            pointsDiscount={pointsDiscount}
            payable={payable}
          />

          <FormError message={error} />

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setStep(1)}
              disabled={Boolean(placedOrder)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={placeOrder}
              loading={placing}
              disabled={!canPlaceOrder}
              className="flex-[2]"
            >
              {payButtonLabel}
            </Button>
          </div>
          {!canPlaceOrder && (
            <p className="text-center text-label text-ink-muted">
              Upload your proof of payment to continue.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function PickupNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand bg-brand-tint p-4">
      <MapPin size={20} className="mt-0.5 shrink-0 text-brand" />
      <div>
        <p className="font-semibold">Pickup at Belle Food</p>
        <p className="text-body text-ink-muted">{STORE.address}</p>
        <p className="mt-1 text-body font-medium text-brand">{STORE.hours}</p>
      </div>
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ['Details', 'Payment']
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, index) => {
        const position = index + 1
        const done = step > position
        const active = step === position
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex flex-1 items-center gap-2"
          >
            <span
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full text-label font-bold',
                active ? 'bg-brand text-white' : done ? 'bg-success text-white' : 'bg-line text-ink-muted'
              )}
            >
              {done ? <Check size={14} /> : position}
            </span>
            <span className={cn('text-body font-medium', active ? 'text-ink' : 'text-ink-muted')}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function OrderSummary({
  totals,
  fulfilment,
  zoneName,
  pointsDiscount,
  payable,
}: {
  totals: OrderTotals
  fulfilment: FulfilmentMethod
  zoneName: string
  pointsDiscount: number
  payable: number
}) {
  const deliveryLabel =
    fulfilment === 'pickup' ? 'Pickup' : `Delivery${zoneName ? ` (${zoneName})` : ''}`
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-body">
      <SummaryRow label="Subtotal" value={formatNaira(totals.subtotal)} />
      <SummaryRow label={deliveryLabel} value={deliveryFeeLabel(totals.deliveryFee)} />
      {pointsDiscount > 0 && (
        <SummaryRow label="Belle Rewards" value={rewardsDiscountLabel(pointsDiscount)} tone="reward" />
      )}
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-brand">{formatNaira(payable)}</span>
      </div>
    </div>
  )
}

function FulfilmentCard({
  active,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  active: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors',
        active ? 'border-brand bg-brand-tint' : 'border-line bg-white'
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 place-items-center rounded-xl',
          active ? 'bg-brand text-white' : 'bg-brand-tint text-brand'
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block font-bold leading-tight">{title}</span>
        <span className="block text-label text-ink-muted">{subtitle}</span>
      </span>
    </button>
  )
}

function PaymentOption({
  active,
  disabled,
  onSelect,
  icon,
  title,
  detail,
}: {
  active: boolean
  disabled: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        active ? 'border-brand bg-brand-tint' : 'border-line'
      )}
    >
      <span className="text-brand">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-body text-ink-muted">{detail}</span>
      </span>
    </button>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label text-ink-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
