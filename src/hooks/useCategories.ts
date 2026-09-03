import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'
import type { Database } from '@/lib/database.types'

export type Category = Database['public']['Tables']['categories']['Row']

export function useCategories(includeInactive = false) {
  const cacheKey = `categories:${includeInactive}`
  const cached = getCache<Category[]>(cacheKey)
  const [categories, setCategories] = useState<Category[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)

  const load = useCallback(async () => {
    let request = supabase.from('categories').select('*').order('sort_order')
    if (!includeInactive) request = request.eq('is_active', true)
    const { data } = await request
    if (data) setCache(cacheKey, data, 120_000)
    setCategories(data ?? [])
    setLoading(false)
  }, [includeInactive, cacheKey])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, reload: load }
}

export function categoryLabel(categories: Category[], slug: string): string {
  return categories.find(category => category.slug === slug)?.label ?? slug
}
