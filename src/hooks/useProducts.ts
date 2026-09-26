import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'
import type { Product } from '@/lib/types'

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating'

export interface ProductQuery {
  store?: string
  category?: string
  search?: string
  sort?: ProductSort
  featuredOnly?: boolean
  limit?: number
  enabled?: boolean
}

/** Keeps pinned items first, then interleaves brands so one brand never fills a whole row. */
function interleaveBrands(items: Product[]): Product[] {
  const pinned = items.filter(product => product.sort_priority > 0)
  const groups = new Map<string, Product[]>()
  for (const product of items) {
    if (product.sort_priority > 0) continue
    const brand = product.brand ?? ''
    groups.set(brand, [...(groups.get(brand) ?? []), product])
  }

  const queues = [...groups.values()]
  const interleaved: Product[] = []
  for (let round = 0; interleaved.length + pinned.length < items.length; round += 1) {
    for (const queue of queues) {
      if (queue[round]) interleaved.push(queue[round])
    }
  }
  return [...pinned, ...interleaved]
}

const escapeLike = (term: string) => term.replace(/[\\%_]/g, character => `\\${character}`)

export function useProducts(query: ProductQuery = {}) {
  const { store, category, search, sort = 'newest', featuredOnly, limit, enabled = true } = query
  const cacheKey = `products:${store ?? ''}:${category ?? ''}:${search ?? ''}:${sort}:${featuredOnly ?? ''}:${limit ?? ''}`
  const [products, setProducts] = useState<Product[]>(() => getCache<Product[]>(cacheKey) ?? [])
  const [loading, setLoading] = useState(() => !getCache(cacheKey))

  useEffect(() => {
    if (!enabled) {
      setProducts([])
      setLoading(false)
      return
    }
    let active = true
    const cached = getCache<Product[]>(cacheKey)
    if (cached) {
      setProducts(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const fetchProducts = async () => {
      let request = supabase.from('products').select('*').eq('is_published', true)
      if (store) request = request.eq('store', store)
      if (category) request = request.eq('category', category)
      if (featuredOnly) request = request.eq('featured', true)
      if (search) request = request.ilike('name', `%${escapeLike(search)}%`)

      request = request.order('sort_priority', { ascending: false })
      if (sort === 'price_asc') request = request.order('price', { ascending: true })
      else if (sort === 'price_desc') request = request.order('price', { ascending: false })
      else if (sort === 'rating') request = request.order('rating', { ascending: false })
      else request = request.order('created_at', { ascending: false })
      if (limit) request = request.limit(limit)

      const { data } = await request
      if (!active) return
      if (data) {
        const ordered = sort === 'price_asc' || sort === 'price_desc' ? data : interleaveBrands(data)
        setCache(cacheKey, ordered)
        setProducts(ordered)
      }
      setLoading(false)
    }
    void fetchProducts()

    return () => {
      active = false
    }
  }, [cacheKey, store, category, search, sort, featuredOnly, limit, enabled])

  return { products, loading }
}

export function useProduct(slug: string) {
  const cacheKey = `product:${slug}`
  const [product, setProduct] = useState<Product | null>(() => getCache<Product>(cacheKey) ?? null)

  useEffect(() => {
    let active = true
    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return
        setCache(cacheKey, data)
        setProduct(data)
      })
    return () => {
      active = false
    }
  }, [slug, cacheKey])

  return { product }
}
