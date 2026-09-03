'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'

export default function AddressPage() {
  const { session } = useAuth()
  const { zones } = useDeliveryZones()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', street: '', area: '' })

  useEffect(() => {
    if (!session) return
    supabase
      .from('user_addresses')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAddressId(data.id)
          setForm({
            fullName: data.full_name ?? '',
            phone: data.phone ?? '',
            street: data.street ?? '',
            area: data.city ?? '',
          })
        }
        setLoading(false)
      })
  }, [session])

  useEffect(() => {
    if (!form.area && zones.length) setForm(prev => ({ ...prev, area: zones[0].name }))
  }, [zones, form.area])

  const save = async () => {
    if (!session) return
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      full_name: form.fullName,
      phone: form.phone,
      street: form.street,
      city: form.area,
      state: 'Lagos',
      is_default: true,
    }
    if (addressId) {
      await supabase.from('user_addresses').update(payload).eq('id', addressId)
    } else {
      const { data } = await supabase.from('user_addresses').insert(payload).select('id').single()
      if (data) setAddressId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value })

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-app flex-col gap-4">
      <Link to="/account" className="flex items-center gap-1 text-body font-semibold text-brand">
        <ArrowLeft size={16} /> Account
      </Link>
      <h1 className="text-2xl font-bold">Delivery Address</h1>
      <p className="text-body text-ink-muted">Saved for faster checkout on your next order.</p>

      <Field label="Full Name">
        <input value={form.fullName} onChange={e => set('fullName')(e.target.value)} className="input" />
      </Field>
      <Field label="Phone Number">
        <input value={form.phone} onChange={e => set('phone')(e.target.value)} className="input" />
      </Field>
      <Field label="Delivery Area">
        <select value={form.area} onChange={e => set('area')(e.target.value)} className="input">
          {zones.map(zone => (
            <option key={zone.id} value={zone.name}>
              {zone.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Street Address">
        <input value={form.street} onChange={e => set('street')(e.target.value)} className="input" />
      </Field>

      <Button
        size="lg"
        fullWidth
        loading={saving}
        disabled={!form.fullName || !form.phone || !form.street || !form.area}
        onClick={save}
      >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="input-label">{label}</span>
      {children}
    </label>
  )
}
