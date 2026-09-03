'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { Button } from '@/components/ui/Button'

interface ZoneRow {
  id: string | null
  name: string
  fee: string
}

export default function AdminSettings() {
  const { settings, loading } = useStoreSettings()
  const { zones: initialZones, loading: zonesLoading } = useDeliveryZones(true)

  const [form, setForm] = useState({
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    whatsapp_number: '',
    support_email: '',
    free_delivery_threshold: '100000',
  })
  const [zones, setZones] = useState<ZoneRow[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        bank_account_name: settings.bank_account_name ?? '',
        bank_name: settings.bank_name ?? '',
        bank_account_number: settings.bank_account_number ?? '',
        whatsapp_number: settings.whatsapp_number ?? '',
        support_email: settings.support_email ?? '',
        free_delivery_threshold: String(settings.free_delivery_threshold),
      })
    }
  }, [settings])

  useEffect(() => {
    if (initialZones.length && zones.length === 0) {
      setZones(initialZones.map(z => ({ id: z.id, name: z.name, fee: String(Number(z.fee)) })))
    }
  }, [initialZones, zones.length])

  const save = async () => {
    setSaving(true)

    await supabase
      .from('store_settings')
      .update({
        bank_account_name: form.bank_account_name || null,
        bank_name: form.bank_name || null,
        bank_account_number: form.bank_account_number || null,
        whatsapp_number: form.whatsapp_number || null,
        support_email: form.support_email || null,
        free_delivery_threshold: Number(form.free_delivery_threshold),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)

    for (const [index, zone] of zones.entries()) {
      if (!zone.name.trim()) continue
      const payload = { name: zone.name.trim(), fee: Number(zone.fee) || 0, sort_order: index }
      if (zone.id) await supabase.from('delivery_zones').update(payload).eq('id', zone.id)
      else await supabase.from('delivery_zones').insert(payload)
    }
    for (const id of removedIds) await supabase.from('delivery_zones').delete().eq('id', id)
    setRemovedIds([])

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value })

  const updateZone = (index: number, patch: Partial<ZoneRow>) =>
    setZones(zones.map((z, i) => (i === index ? { ...z, ...patch } : z)))

  const removeZone = (index: number) => {
    const zone = zones[index]
    if (zone.id) setRemovedIds([...removedIds, zone.id])
    setZones(zones.filter((_, i) => i !== index))
  }

  if (loading || zonesLoading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-bold">Bank Account (shown at checkout)</h2>
        <Field label="Account Name">
          <input value={form.bank_account_name} onChange={set('bank_account_name')} className="input" />
        </Field>
        <Field label="Bank Name">
          <input value={form.bank_name} onChange={set('bank_name')} className="input" />
        </Field>
        <Field label="Account Number">
          <input
            value={form.bank_account_number}
            onChange={set('bank_account_number')}
            className="input"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Delivery Areas</h2>
          <button
            type="button"
            onClick={() => setZones([...zones, { id: null, name: '', fee: '0' }])}
            className="flex items-center gap-1 text-body font-semibold text-brand"
          >
            <Plus size={16} /> Add area
          </button>
        </div>
        {zones.map((zone, index) => (
          <div key={zone.id ?? `new-${index}`} className="flex gap-2">
            <input
              value={zone.name}
              onChange={e => updateZone(index, { name: e.target.value })}
              placeholder="Area name"
              className="input flex-1"
            />
            <input
              type="number"
              value={zone.fee}
              onChange={e => updateZone(index, { fee: e.target.value })}
              placeholder="Fee"
              className="input w-28"
            />
            <button
              type="button"
              onClick={() => removeZone(index)}
              aria-label="Remove area"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-ink-muted"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <Field label="Free delivery over (₦)">
          <input
            type="number"
            value={form.free_delivery_threshold}
            onChange={set('free_delivery_threshold')}
            className="input"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-bold">Support</h2>
        <Field label="WhatsApp number (e.g. 2348012345678)">
          <input value={form.whatsapp_number} onChange={set('whatsapp_number')} className="input" />
        </Field>
        <Field label="Support email">
          <input value={form.support_email} onChange={set('support_email')} className="input" />
        </Field>
      </section>

      <Button size="lg" fullWidth loading={saving} onClick={save}>
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          'Save Settings'
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
