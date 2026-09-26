import { useToasts } from '@/stores/toast'
import { formatNaira } from '@/lib/format'
import { SITE } from '@/lib/site'
import { copyToClipboard } from '@/lib/text'
import type { Product } from '@/lib/types'

export function useShareProduct() {
  const pushToast = useToasts(state => state.push)

  return async (product: Product) => {
    const url = `${SITE.url}/product/${product.slug}`
    const text = `${product.name} · ${formatNaira(product.price)}`

    if (typeof navigator.share === 'function') {
      await navigator.share({ title: product.name, text, url }).catch(() => undefined)
      return
    }

    if (await copyToClipboard(url)) {
      pushToast({ title: 'Link copied', message: 'Item link copied. Paste it anywhere to share.' })
    }
  }
}
