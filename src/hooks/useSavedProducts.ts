import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { useWishlist } from '@/stores/wishlist'

export function useSavedProducts() {
  const ids = useWishlist(state => state.ids)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        if (active) {
          setProducts(data ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [ids])

  return { products, loading }
}
