import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import type { LoyaltySettings } from '@/lib/types'

export interface PointsEntry {
  id: string
  delta: number
  reason: string
  created_at: string
}

/** Matches the column defaults in loyalty_settings, used until the real row arrives. */
export const LOYALTY_DEFAULTS: LoyaltySettings = {
  naira_per_point: 100,
  earn_per_order: 10,
  earn_per_referral: 5,
  welcome_bonus: 0,
}

const LEDGER_SIZE = 20
const LOYALTY_COLUMNS = 'naira_per_point, earn_per_order, earn_per_referral, welcome_bonus'

export function useLoyalty() {
  const { userId } = useAuth()
  const [points, setPoints] = useState(0)
  const [username, setUsername] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [settings, setSettings] = useState<LoyaltySettings>(LOYALTY_DEFAULTS)
  const [ledger, setLedger] = useState<PointsEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const settingsRequest = supabase.from('loyalty_settings').select(LOYALTY_COLUMNS).maybeSingle()

    if (!userId) {
      const { data: loyaltySettings } = await settingsRequest
      if (loyaltySettings) setSettings(loyaltySettings)
      setLoading(false)
      return
    }

    const [{ data: profile }, { data: loyaltySettings }, { data: referrals }, { data: entries }] =
      await Promise.all([
        supabase.from('profiles').select('points, username').eq('id', userId).maybeSingle(),
        settingsRequest,
        supabase.rpc('referral_count'),
        supabase
          .from('points_ledger')
          .select('id, delta, reason, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(LEDGER_SIZE),
      ])

    setPoints(profile?.points ?? 0)
    setUsername(profile?.username ?? null)
    if (loyaltySettings) setSettings(loyaltySettings)
    setReferralCount(referrals ?? 0)
    setLedger(entries ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const claimUsername = useCallback(
    async (value: string): Promise<string | null> => {
      const { error } = await supabase.rpc('claim_username', { p_username: value })
      if (error) return error.message
      await load()
      return null
    },
    [load]
  )

  return {
    points,
    username,
    referralCount,
    settings,
    ledger,
    nairaValue: points * settings.naira_per_point,
    loading,
    reload: load,
    claimUsername,
  }
}
