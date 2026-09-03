import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type DeliveryZone = Database['public']['Tables']['delivery_zones']['Row']

export function useDeliveryZones(includeInactive = false) {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let request = supabase.from('delivery_zones').select('*').order('sort_order')
    if (!includeInactive) request = request.eq('is_active', true)
    request.then(({ data }) => {
      if (!active) return
      setZones(data ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [includeInactive])

  return { zones, loading }
}
