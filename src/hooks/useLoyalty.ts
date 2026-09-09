import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

export interface LoyaltySettings {
  naira_per_point: number
  earn_per_order: number
  earn_per_referral: number
  welcome_bonus: number
}

export interface PointsEntry {
  id: string
  delta: number
  reason: string
  created_at: string
}

const DEFAULT_SETTINGS: LoyaltySettings = {
  naira_per_point: 100,
  earn_per_order: 10,
  earn_per_referral: 5,
  welcome_bonus: 0,
}

export function useLoyalty() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [points, setPoints] = useState(0)
  const [username, setUsername] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS)
  const [ledger, setLedger] = useState<PointsEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const settingsPromise = supabase
      .from('loyalty_settings')
      .select('naira_per_point, earn_per_order, earn_per_referral, welcome_bonus')
      .maybeSingle()

    if (!userId) {
      const { data: s } = await settingsPromise
      if (s) setSettings(s)
      setLoading(false)
      return
    }

    const [{ data: profile }, { data: s }, { count }, { data: entries }] = await Promise.all([
      supabase.from('profiles').select('points, username').eq('id', userId).maybeSingle(),
      settingsPromise,
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId),
      supabase
        .from('points_ledger')
        .select('id, delta, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    setPoints(profile?.points ?? 0)
    setUsername(profile?.username ?? null)
    if (s) setSettings(s)
    setReferralCount(count ?? 0)
    setLedger(entries ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
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
