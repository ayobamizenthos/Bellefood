'use client'

import { useEffect, useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

interface LoyaltyForm {
  naira_per_point: string
  earn_per_order: string
  earn_per_referral: string
  welcome_bonus: string
}

const FIELDS: { key: keyof LoyaltyForm; label: string; hint: string }[] = [
  { key: 'naira_per_point', label: 'Naira value per point (₦)', hint: 'What 1 point is worth at checkout' },
  { key: 'earn_per_order', label: 'Points per order', hint: 'Earned when a payment is confirmed' },
  { key: 'earn_per_referral', label: 'Points per referral', hint: "When an invited friend's first order is paid" },
  { key: 'welcome_bonus', label: 'Welcome bonus', hint: 'Points granted to a new customer' },
]

export function LoyaltySettingsForm() {
  const [form, setForm] = useState<LoyaltyForm>({
    naira_per_point: '100',
    earn_per_order: '10',
    earn_per_referral: '5',
    welcome_bonus: '0',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('loyalty_settings')
      .select('naira_per_point, earn_per_order, earn_per_referral, welcome_bonus')
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm({
            naira_per_point: String(data.naira_per_point),
            earn_per_order: String(data.earn_per_order),
            earn_per_referral: String(data.earn_per_referral),
            welcome_bonus: String(data.welcome_bonus),
          })
      })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase
      .from('loyalty_settings')
      .update({
        naira_per_point: Number(form.naira_per_point) || 0,
        earn_per_order: Math.trunc(Number(form.earn_per_order) || 0),
        earn_per_referral: Math.trunc(Number(form.earn_per_referral) || 0),
        welcome_bonus: Math.trunc(Number(form.welcome_bonus) || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        <label key={field.key} className="flex flex-col gap-1.5">
          <span className="input-label">{field.label}</span>
          <input
            type="number"
            min="0"
            value={form[field.key]}
            onChange={e => setForm({ ...form, [field.key]: e.target.value })}
            className="input"
          />
          <span className="text-label text-ink-muted">{field.hint}</span>
        </label>
      ))}
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
