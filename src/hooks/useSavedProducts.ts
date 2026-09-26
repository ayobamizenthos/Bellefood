import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { useWishlist } from '@/stores/wishlist'

export function useSavedProducts() {
  const ids = useWishlist(state => state.ids)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      return
    }
    let active = true
    supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('is_published', true)
      .then(({ data }) => {
        if (active) setProducts(data ?? [])
      })
    return () => {
      active = false
    }
  }, [ids])

  return { products }
}
