'use client'

import { useToasts } from '@/stores/toast'
import { formatNaira } from '@/lib/format'
import { SITE } from '@/lib/site'
import type { Product } from '@/lib/types'

export function useShareProduct() {
  const push = useToasts(s => s.push)

  return async (product: Product) => {
    const url = `${SITE.url}/product/${product.slug}`
    const priceLabel = product.cable_pricing
      ? `${formatNaira(product.price)} / yard`
      : formatNaira(product.price)
    const text = `${product.name} · ${priceLabel}`

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: product.name, text, url })
      } catch {
        return
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      push({ title: 'Link copied', message: 'Item link copied. Paste it anywhere to share.' })
    } catch {
      return
    }
  }
}
