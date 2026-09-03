import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'
import type { Product } from '@/lib/types'

export interface ProductQuery {
  store?: string
  category?: string
  search?: string
  brand?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating'
  featuredOnly?: boolean
}

function mixByBrand(items: Product[]): Product[] {
  const pinned = items.filter(p => p.sort_priority > 0)
  const rest = items.filter(p => p.sort_priority <= 0)

  const groups = new Map<string, Product[]>()
  for (const product of rest) {
    const brand = product.brand ?? 'zzz'
    if (!groups.has(brand)) groups.set(brand, [])
    groups.get(brand)!.push(product)
  }

  const lists = [...groups.values()]
  const mixed: Product[] = []
  let added = true
  while (added) {
    added = false
    for (const list of lists) {
      const next = list.shift()
      if (next) {
        mixed.push(next)
        added = true
      }
    }
  }
  return [...pinned, ...mixed]
}

export function useProducts(query: ProductQuery = {}) {
  const { store, category, search, brand, sort = 'newest', featuredOnly } = query
  const cacheKey = `products:${store ?? ''}:${category ?? ''}:${search ?? ''}:${brand ?? ''}:${sort}:${featuredOnly ?? ''}`
  const cached = getCache<Product[]>(cacheKey)
  const [products, setProducts] = useState<Product[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let active = true
    const hit = getCache<Product[]>(cacheKey)
    if (hit) {
      setProducts(hit)
      setLoading(false)
    } else {
      setLoading(true)
    }

    ;(async () => {
      let request = supabase.from('products').select('*').eq('is_published', true)
      if (store) request = request.eq('store', store)
      if (category) request = request.eq('category', category)
      if (brand) request = request.eq('brand', brand)
      if (featuredOnly) request = request.eq('featured', true)
      if (search) request = request.ilike('name', `%${search}%`)

      request = request.order('sort_priority', { ascending: false })

      switch (sort) {
        case 'price_asc':
          request = request.order('price', { ascending: true })
          break
        case 'price_desc':
          request = request.order('price', { ascending: false })
          break
        case 'rating':
          request = request.order('rating', { ascending: false })
          break
        default:
          request = request.order('created_at', { ascending: false })
      }

      const { data } = await request
      if (active && data) {
        const ordered = sort === 'price_asc' || sort === 'price_desc' ? data : mixByBrand(data)
        setCache(cacheKey, ordered)
        setProducts(ordered)
        setLoading(false)
      } else if (active) {
        setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [cacheKey, store, category, search, brand, sort, featuredOnly])

  return { products, loading }
}

export function useProduct(slug: string | undefined) {
  const cacheKey = `product:${slug ?? ''}`
  const cached = getCache<Product>(cacheKey)
  const [product, setProduct] = useState<Product | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (!slug) return
    let active = true
    const hit = getCache<Product>(cacheKey)
    if (hit) {
      setProduct(hit)
      setLoading(false)
    } else {
      setLoading(true)
    }

    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (!active) return
        if (data) setCache(cacheKey, data)
        setProduct(data)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug, cacheKey])

  return { product, loading }
}
