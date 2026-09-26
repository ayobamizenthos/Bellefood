'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { PageSpinner } from '@/components/ui/BrandLoader'

interface AddressForm {
  fullName: string
  phone: string
  street: string
  zoneId: string
}

const SAVED_FEEDBACK_MS = 2000

export default function AddressScreen() {
  const { userId } = useAuth()
  const { zones } = useDeliveryZones()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [addressId, setAddressId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>({ fullName: '', phone: '', street: '', zoneId: '' })

  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()
      .then(({ data: address }) => {
        if (address) {
          setAddressId(address.id)
          setForm({
            fullName: address.full_name,
            phone: address.phone,
            street: address.street,
            zoneId: address.zone_id ?? '',
          })
        }
        setLoading(false)
      })
  }, [userId])

  useEffect(() => {
    if (zones.length === 0) return
    setForm(current =>
      zones.some(zone => zone.id === current.zoneId) ? current : { ...current, zoneId: zones[0].id }
    )
  }, [zones])

  const updateField = (key: keyof AddressForm) => (value: string) =>
    setForm(current => ({ ...current, [key]: value }))

  const saveAddress = async () => {
    if (!userId) return
    setError('')
    setSaving(true)
    const zone = zones.find(entry => entry.id === form.zoneId)
    const payload = {
      user_id: userId,
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      zone_id: form.zoneId,
      city: zone?.name ?? '',
      state: 'Lagos',
      is_default: true,
    }
    const { data, error: saveError } = addressId
      ? await supabase.from('user_addresses').update(payload).eq('id', addressId).select('id').single()
      : await supabase.from('user_addresses').insert(payload).select('id').single()
    setSaving(false)
    if (saveError || !data) {
      setError('Your address could not be saved. Please try again.')
      return
    }
    setAddressId(data.id)
    setSaved(true)
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS)
  }

  if (loading) return <PageSpinner />

  const complete = Boolean(form.fullName.trim() && form.phone.trim() && form.street.trim() && form.zoneId)

  return (
    <div className="mx-auto flex max-w-app flex-col gap-4">
      <Link
        href="/account"
        className="flex min-h-[44px] items-center gap-1 self-start text-body font-semibold text-brand"
      >
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="text-2xl font-bold">Delivery Address</h1>
      <p className="text-body text-ink-muted">Saved for faster checkout on your next order.</p>

      <Field label="Full Name">
        <input
          value={form.fullName}
          onChange={event => updateField('fullName')(event.target.value)}
          autoComplete="name"
          className="input"
        />
      </Field>
      <Field label="Phone Number">
        <input
          type="tel"
          value={form.phone}
          onChange={event => updateField('phone')(event.target.value)}
          autoComplete="tel"
          className="input"
        />
      </Field>
      <Field label="Delivery Area">
        <select
          value={form.zoneId}
          onChange={event => updateField('zoneId')(event.target.value)}
          className="input"
        >
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Street Address">
        <input
          value={form.street}
          onChange={event => updateField('street')(event.target.value)}
          autoComplete="street-address"
          className="input"
        />
      </Field>

      <FormError message={error} />

      <Button size="lg" fullWidth loading={saving} disabled={!complete} onClick={saveAddress}>
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          'Save Address'
        )}
      </Button>
    </div>
  )
}
