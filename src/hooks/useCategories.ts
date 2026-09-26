import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'
import type { Category } from '@/lib/types'

const CATEGORY_CACHE_MS = 120_000

export function useCategories(includeInactive = false) {
  const cacheKey = `categories:${includeInactive}`
  const [categories, setCategories] = useState<Category[]>(() => getCache<Category[]>(cacheKey) ?? [])
  const [loading, setLoading] = useState(() => !getCache(cacheKey))

  const load = useCallback(async () => {
    let request = supabase.from('categories').select('*').order('sort_order')
    if (!includeInactive) request = request.eq('is_active', true)
    const { data } = await request
    if (data) {
      setCache(cacheKey, data, CATEGORY_CACHE_MS)
      setCategories(data)
    }
    setLoading(false)
  }, [includeInactive, cacheKey])

  useEffect(() => {
    void load()
  }, [load])

  return { categories, loading, reload: load }
}

export function categoryLabel(categories: Category[], slug: string): string {
  return categories.find(category => category.slug === slug)?.label ?? slug
}
