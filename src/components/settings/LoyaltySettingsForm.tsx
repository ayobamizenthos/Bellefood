'use client'

import { useEffect, useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LOYALTY_DEFAULTS } from '@/hooks/useLoyalty'
import type { LoyaltySettings } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'

type LoyaltyForm = Record<keyof LoyaltySettings, string>

const SAVED_FEEDBACK_MS = 2000

const FIELDS: { key: keyof LoyaltySettings; label: string; hint: string; minimum: number }[] = [
  { key: 'naira_per_point', label: 'Naira value per point (₦)', hint: 'What 1 point is worth at checkout', minimum: 1 },
  { key: 'earn_per_order', label: 'Points per order', hint: 'Earned when a payment is confirmed', minimum: 0 },
  { key: 'earn_per_referral', label: 'Points per referral', hint: "When an invited friend's first order is paid", minimum: 0 },
  { key: 'welcome_bonus', label: 'Welcome bonus', hint: 'Points granted to a new customer', minimum: 0 },
]

const toForm = (settings: LoyaltySettings): LoyaltyForm => ({
  naira_per_point: String(settings.naira_per_point),
  earn_per_order: String(settings.earn_per_order),
  earn_per_referral: String(settings.earn_per_referral),
  welcome_bonus: String(settings.welcome_bonus),
})

function parseForm(form: LoyaltyForm): LoyaltySettings | string {
  for (const field of FIELDS) {
    const raw = form[field.key].trim()
    const value = Number(raw)
    const whole = field.key !== 'naira_per_point'
    if (raw === '' || !Number.isFinite(value) || value < field.minimum || (whole && !Number.isInteger(value))) {
      return `${field.label} must be ${whole ? 'a whole number' : 'a number'} of at least ${field.minimum}.`
    }
  }
  return {
    naira_per_point: Number(form.naira_per_point),
    earn_per_order: Number(form.earn_per_order),
    earn_per_referral: Number(form.earn_per_referral),
    welcome_bonus: Number(form.welcome_bonus),
  }
}

export function LoyaltySettingsForm() {
  const [form, setForm] = useState<LoyaltyForm>(toForm(LOYALTY_DEFAULTS))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('loyalty_settings')
      .select('naira_per_point, earn_per_order, earn_per_referral, welcome_bonus')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(toForm(data))
      })
  }, [])

  const save = async () => {
    setError('')
    const parsed = parseForm(form)
    if (typeof parsed === 'string') {
      setError(parsed)
      return
    }
    setSaving(true)
    const { error: saveError } = await supabase
      .from('loyalty_settings')
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq('id', true)
    setSaving(false)
    if (saveError) {
      setError('Loyalty settings could not be saved. Please try again.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <div>
        <h2 className="flex items-center gap-2 font-bold">
          <Gift size={18} className="text-brand" /> Loyalty &amp; Rewards
        </h2>
        <p className="text-label text-ink-muted">Points pay for meals and delivery only.</p>
      </div>
      {FIELDS.map(field => (
        <Field key={field.key} label={field.label} hint={field.hint}>
          <input
            type="number"
            inputMode="numeric"
            min={field.minimum}
            value={form[field.key]}
            onChange={event => setForm({ ...form, [field.key]: event.target.value })}
            className="input"
          />
        </Field>
      ))}
      <FormError message={error} />
      <Button loading={saving} onClick={save}>
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          'Save Loyalty Settings'
        )}
      </Button>
    </section>
  )
}
