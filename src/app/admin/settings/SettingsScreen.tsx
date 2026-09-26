'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useDeliveryZones } from '@/hooks/useDeliveryZones'
import { PageSpinner } from '@/components/ui/BrandLoader'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { AlertsToggle } from '@/components/settings/AlertsToggle'
import { LoyaltySettingsForm } from '@/components/settings/LoyaltySettingsForm'

interface ZoneRow {
  key: string
  id: string | null
  name: string
  fee: string
}

interface SettingsForm {
  bank_account_name: string
  bank_name: string
  bank_account_number: string
  whatsapp_number: string
  support_email: string
  free_delivery_threshold: string
}

const SAVED_FEEDBACK_MS = 2000

const isAmount = (raw: string) => raw.trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0

export default function SettingsScreen() {
  const { settings, loading, reload } = useStoreSettings()
  const { zones: savedZones, loading: zonesLoading } = useDeliveryZones(true)

  const [form, setForm] = useState<SettingsForm>({
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    whatsapp_number: '',
    support_email: '',
    free_delivery_threshold: '',
  })
  const [zones, setZones] = useState<ZoneRow[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!settings) return
    setForm({
      bank_account_name: settings.bank_account_name ?? '',
      bank_name: settings.bank_name ?? '',
      bank_account_number: settings.bank_account_number ?? '',
      whatsapp_number: settings.whatsapp_number ?? '',
      support_email: settings.support_email ?? '',
      free_delivery_threshold: String(settings.free_delivery_threshold),
    })
  }, [settings])

  useEffect(() => {
    setZones(savedZones.map(zone => ({ key: zone.id, id: zone.id, name: zone.name, fee: String(Number(zone.fee)) })))
  }, [savedZones])

  const validationError = (): string | null => {
    if (!isAmount(form.free_delivery_threshold)) return 'Free delivery threshold must be a number of 0 or more.'
    const invalidZone = zones.find(zone => zone.name.trim() && !isAmount(zone.fee))
    if (invalidZone) return `The fee for ${invalidZone.name.trim()} must be a number of 0 or more.`
    return null
  }

  const saveZones = async (): Promise<boolean> => {
    const updated: ZoneRow[] = []
    for (const [index, zone] of zones.entries()) {
      if (!zone.name.trim()) continue
      const payload = { name: zone.name.trim(), fee: Number(zone.fee), sort_order: index }
      const { data, error: zoneError } = zone.id
        ? await supabase.from('delivery_zones').update(payload).eq('id', zone.id).select('id').single()
        : await supabase.from('delivery_zones').insert(payload).select('id').single()
      if (zoneError || !data) return false
      updated.push({ ...zone, id: data.id })
    }
    for (const id of removedIds) {
      const { error: deleteError } = await supabase.from('delivery_zones').delete().eq('id', id)
      if (deleteError) return false
    }
    setZones(updated)
    setRemovedIds([])
    return true
  }

  const saveSettings = async () => {
    setError('')
    const problem = validationError()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    const { error: settingsError } = await supabase
      .from('store_settings')
      .update({
        bank_account_name: form.bank_account_name.trim() || null,
        bank_name: form.bank_name.trim() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        support_email: form.support_email.trim() || null,
        free_delivery_threshold: Number(form.free_delivery_threshold),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
    const zonesSaved = !settingsError && (await saveZones())
    setSaving(false)
    if (!zonesSaved) {
      setError('Some settings could not be saved. Please try again.')
      return
    }
    void reload()
    setSaved(true)
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS)
  }

  const bindField = (key: keyof SettingsForm) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm(current => ({ ...current, [key]: event.target.value }))

  const updateZone = (key: string, patch: Partial<ZoneRow>) =>
    setZones(current => current.map(zone => (zone.key === key ? { ...zone, ...patch } : zone)))

  const removeZone = (row: ZoneRow) => {
    const savedId = row.id
    if (savedId) setRemovedIds(current => [...current, savedId])
    setZones(current => current.filter(zone => zone.key !== row.key))
  }

  const addZone = () =>
    setZones(current => [...current, { key: crypto.randomUUID(), id: null, name: '', fee: '0' }])

  if (loading || zonesLoading) return <PageSpinner />

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-bold">Bank Account (shown at checkout)</h2>
        <Field label="Account Name">
          <input value={form.bank_account_name} onChange={bindField('bank_account_name')} className="input" />
        </Field>
        <Field label="Bank Name">
          <input value={form.bank_name} onChange={bindField('bank_name')} className="input" />
        </Field>
        <Field label="Account Number">
          <input
            inputMode="numeric"
            value={form.bank_account_number}
            onChange={bindField('bank_account_number')}
            className="input"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Delivery Areas</h2>
          <button
            type="button"
            onClick={addZone}
            className="flex min-h-[44px] items-center gap-1 text-body font-semibold text-brand"
          >
            <Plus size={16} /> Add area
          </button>
        </div>
        {zones.map(zone => (
          <div key={zone.key} className="flex gap-2">
            <input
              value={zone.name}
              onChange={event => updateZone(zone.key, { name: event.target.value })}
              placeholder="Area name"
              aria-label="Area name"
              className="input flex-1"
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={zone.fee}
              onChange={event => updateZone(zone.key, { fee: event.target.value })}
              placeholder="Fee"
              aria-label={`Delivery fee for ${zone.name || 'this area'}`}
              className="input w-28"
            />
            <button
              type="button"
              onClick={() => removeZone(zone)}
              aria-label={`Remove ${zone.name || 'area'}`}
              className="grid h-11 w-11 shrink-0 place-items-center text-danger transition-transform active:scale-90"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <Field
          label="Free delivery over (₦)"
          hint={isAmount(form.free_delivery_threshold) ? formatNaira(Number(form.free_delivery_threshold)) : undefined}
        >
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={form.free_delivery_threshold}
            onChange={bindField('free_delivery_threshold')}
            className="input"
          />
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-bold">Support</h2>
        <Field label="WhatsApp number" hint="International format without the plus, e.g. 2348012345678">
          <input type="tel" value={form.whatsapp_number} onChange={bindField('whatsapp_number')} className="input" />
        </Field>
        <Field label="Support email">
          <input type="email" value={form.support_email} onChange={bindField('support_email')} className="input" />
        </Field>
      </section>

      <FormError message={error} />

      <Button size="lg" fullWidth loading={saving} onClick={saveSettings}>
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          'Save Settings'
        )}
      </Button>

      <LoyaltySettingsForm />

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">Notifications</h2>
        <AlertsToggle />
      </section>
    </div>
  )
}
