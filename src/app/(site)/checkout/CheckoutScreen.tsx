'use client'

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@/lib/router'
import {
  Bike,
  Building2,
  Check,
  Copy,
  CreditCard,
  ImageUp,
  Loader2,
  MapPin,
  Store,
  X,
} from 'lucide-react'
import { useCart } from '@/stores/cart'
import { useAuth } from '@/stores/auth'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { supabase } from '@/lib/supabase'
import { calculateTotals } from '@/lib/pricing'
import { formatNaira } from '@/lib/format'
import { STORE } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { payWithPaystack } from '@/lib/paystack'

type Step = 1 | 2
type Fulfillment = 'delivery' | 'pickup'
type PaymentMethod = 'paystack' | 'bank_transfer'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clear } = useCart()
  const { session, profile } = useAuth()
  const { settings, loading } = useStoreSettings()
  const { zones } = useDeliveryZones()

  const [step, setStep] = useState<Step>(1)
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery')
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
  const [copied, setCopied] = useState(false)
  const [payError, setPayError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
    if (profile?.phone) setPhone(profile.phone)
  }, [profile])

  useEffect(() => {
    if (!zoneId && zones.length > 0) setZoneId(zones[0].id)
  }, [zones, zoneId])

  if (loading) return <PageSpinner />
  if (items.length === 0) {
    navigate('/cart', { replace: true })
    return null
  }

  const selectedZone = zones.find(zone => zone.id === zoneId)
  const deliveryFee = fulfillment === 'pickup' ? 0 : Number(selectedZone?.fee ?? 0)
  const totals = calculateTotals(items, deliveryFee)

  const contactReady = fullName.trim().length > 0 && phone.trim().length > 0
  const detailsReady =
    fulfillment === 'pickup' ? contactReady : contactReady && street.trim().length > 0 && !!zoneId

  const uploadProof = async (file: File) => {
    if (!session) return
    setProofUploading(true)
    const ext = file.name.split('.').pop() || 'png'
    const path = `${session.user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('payment-proofs').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    setProofUploading(false)
    if (!error) {
      setProofPath(path)
      setProofName(file.name)
    }
  }

  const canPlaceOrder = method === 'paystack' ? true : Boolean(proofPath)

  const copyAccount = async () => {
    if (!settings?.bank_account_number) return
    await navigator.clipboard.writeText(settings.bank_account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const deliveryAddress =
    fulfillment === 'pickup'
      ? { method: 'pickup', fullName, phone, location: STORE.address }
      : { method: 'delivery', fullName, phone, street, landmark, zone: selectedZone?.name ?? '' }

  const placeOrder = async () => {
    if (!session) return
    setPlacing(true)
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        items: items as unknown as never,
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        total: totals.total,
        delivery_method: fulfillment,
        delivery_address: deliveryAddress as unknown as never,
        payment_method: method,
        bank_reference: method === 'bank_transfer' ? bankReference || null : null,
        payment_proof_url: method === 'bank_transfer' ? proofPath || null : null,
        customer_note: note.trim() || null,
      })
      .select('id, order_number')
      .single()

    if (error || !data) {
      setPlacing(false)
      setPayError('Could not create your order. Please try again.')
      return
    }

    if (method === 'bank_transfer') {
      setPlacing(false)
      clear()
      navigate(`/orders/${data.id}?placed=1`, { replace: true })
      return
    }

    try {
      const result = await payWithPaystack({
        email: session.user.email ?? '',
        amountNaira: totals.total,
        reference: data.order_number,
        orderId: data.id,
      })

      if (!result) {
        setPlacing(false)
        setPayError('Payment was cancelled. Your order is saved as pending.')
        return
      }

      const { data: verified } = await supabase.functions.invoke('paystack-verify', {
        body: { reference: result.reference, orderId: data.id },
      })

      setPlacing(false)
      clear()
      if (!verified?.ok) {
        setPayError('Payment received but not yet confirmed. We will verify it shortly.')
      }
      navigate(`/orders/${data.id}?placed=1`, { replace: true })
    } catch {
      setPlacing(false)
      setPayError('Payment could not start. Please try again or use bank transfer.')
    }
  }

  return (
    <div className="mx-auto flex max-w-app flex-col gap-5">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">How would you like your order?</h1>

          <div className="grid grid-cols-2 gap-3">
            <FulfillmentCard
              active={fulfillment === 'delivery'}
              onClick={() => setFulfillment('delivery')}
              icon={<Bike size={22} />}
              title="Delivery"
              subtitle="To your address"
            />
            <FulfillmentCard
              active={fulfillment === 'pickup'}
              onClick={() => setFulfillment('pickup')}
              icon={<Store size={22} />}
              title="Pickup"
              subtitle="Collect at our store"
            />
          </div>

          <Input label="Full Name" value={fullName} onChange={setFullName} />
          <Input label="Phone Number" value={phone} onChange={setPhone} />

          {fulfillment === 'delivery' ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="input-label">Delivery Area</span>
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="input"
                >
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({formatNaira(Number(zone.fee))})
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Street Address" value={street} onChange={setStreet} />
              <Input
                label="Landmark (optional)"
                value={landmark}
                onChange={setLandmark}
                placeholder="Nearest bus stop or building"
              />
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-brand bg-brand-tint p-4">
              <MapPin size={20} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="font-semibold">Pickup at Belle Food</p>
                <p className="text-body text-ink-muted">{STORE.address}</p>
                <p className="mt-1 text-body font-medium text-brand">{STORE.hours}</p>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="input-label">Note for the kitchen (optional)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Extra instructions, allergies, or anything we should know"
              className="w-full rounded-xl border border-line bg-white p-3 text-body outline-none focus:border-brand"
            />
          </label>

          <Button size="lg" fullWidth disabled={!detailsReady} onClick={() => setStep(2)}>
            Continue to Payment
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">Payment</h1>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMethod('paystack')}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                method === 'paystack' ? 'border-brand bg-brand-tint' : 'border-line'
              )}
            >
              <span className="text-brand">
                <CreditCard size={20} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">Pay Now (Card, Transfer, USSD)</p>
                <p className="text-body text-ink-muted">
                  Secure payment via Paystack. Order confirmed instantly.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMethod('bank_transfer')}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                method === 'bank_transfer' ? 'border-brand bg-brand-tint' : 'border-line'
              )}
            >
              <span className="text-brand">
                <Building2 size={20} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">Direct Bank Transfer</p>
                <p className="text-body text-ink-muted">
                  Transfer manually and upload your proof of payment.
                </p>
              </div>
            </button>
          </div>

          {method === 'bank_transfer' && (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-brand">
                <Building2 size={20} />
                <span className="font-semibold">Transfer to:</span>
              </div>
              <Detail label="Account Name" value={settings?.bank_account_name ?? 'Belle Food'} />
              <Detail label="Bank" value={settings?.bank_name ?? 'Not yet configured'} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label text-ink-muted">Account Number</p>
                  <p className="font-semibold">
                    {settings?.bank_account_number ?? 'Not yet configured'}
                  </p>
                </div>
                <button
                  onClick={copyAccount}
                  className="flex items-center gap-1 text-body font-semibold text-brand"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-semibold">Amount to transfer</span>
                <span className="text-2xl font-bold text-brand">{formatNaira(totals.total)}</span>
              </div>
            </div>
          )}

          {method === 'bank_transfer' && (
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
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadProof(file)
                }}
              />

              {proofPath ? (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-3">
                  <Check size={18} className="shrink-0 text-success" />
                  <span className="min-w-0 flex-1 truncate text-body font-medium">{proofName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setProofPath('')
                      setProofName('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    aria-label="Remove file"
                    className="shrink-0 text-ink-muted"
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

              <Input
                label="Transfer reference (optional)"
                value={bankReference}
                onChange={setBankReference}
                placeholder="Your name or transaction ID"
              />
            </div>
          )}

          <div className="rounded-xl bg-brand-tint px-4 py-3 text-body text-brand">
            {method === 'paystack'
              ? 'You will be redirected to a secure Paystack window. Your order is confirmed the moment payment succeeds.'
              : 'Your order will be confirmed once we verify your payment, usually within a few minutes.'}
          </div>

          <OrderSummary
            totals={totals}
            fulfillment={fulfillment}
            zoneName={selectedZone?.name ?? ''}
          />

          {payError && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{payError}</p>
          )}

          <div className="flex gap-3">
            <Button size="lg" variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              size="lg"
              onClick={placeOrder}
              loading={placing}
              disabled={!canPlaceOrder}
              className="flex-[2]"
            >
              {method === 'paystack'
                ? `Pay ${formatNaira(totals.total)}`
                : 'I have made the transfer'}
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

function StepIndicator({ step }: { step: Step }) {
  const labels = ['Details', 'Payment']
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as Step
        const done = step > n
        const active = step === n
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full text-label font-bold',
                active ? 'bg-brand text-white' : done ? 'bg-success text-white' : 'bg-line text-ink-muted'
              )}
            >
              {done ? <Check size={14} /> : n}
            </div>
            <span className={cn('text-body font-medium', active ? 'text-ink' : 'text-ink-muted')}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function OrderSummary({
  totals,
  fulfillment,
  zoneName,
}: {
  totals: ReturnType<typeof calculateTotals>
  fulfillment: Fulfillment
  zoneName: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-body">
      <Row label="Subtotal" value={formatNaira(totals.subtotal)} />
      <Row
        label={fulfillment === 'pickup' ? 'Pickup' : `Delivery${zoneName ? ` (${zoneName})` : ''}`}
        value={
          fulfillment === 'pickup'
            ? 'Free'
            : totals.deliveryFee === 0
              ? 'Free'
              : formatNaira(totals.deliveryFee)
        }
      />
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-brand">{formatNaira(totals.total)}</span>
      </div>
    </div>
  )
}

function FulfillmentCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <div>
        <p className="font-bold leading-tight">{title}</p>
        <p className="text-label text-ink-muted">{subtitle}</p>
      </div>
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
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

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="input-label">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </label>
  )
}
