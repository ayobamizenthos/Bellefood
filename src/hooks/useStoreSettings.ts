import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreSettings } from '@/lib/types'

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .single()
      .then(({ data }) => {
        setSettings(data)
        setLoading(false)
      })
  }, [])

  return { settings, loading }
}
