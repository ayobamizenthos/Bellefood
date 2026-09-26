'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Minus, Plus, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import type { Product } from '@/lib/types'
import { MAX_ITEM_QUANTITY, toCartItem } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'
import { StarRating } from '@/components/ui/StarRating'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { useCart } from '@/stores/cart'
import { useWishlist } from '@/stores/wishlist'

const CARD_IMAGE_WIDTH = 400

export function ProductCard({ product }: { product: Product }) {
  const quantity = useCart(
    state => state.items.find(item => item.productId === product.id)?.quantity ?? 0
  )
  const addItem = useCart(state => state.addItem)
  const setQuantity = useCart(state => state.setQuantity)
  const saved = useWishlist(state => state.ids.includes(product.id))
  const toggleSaved = useWishlist(state => state.toggle)
  const [imageLoaded, setImageLoaded] = useState(false)

  const level = stockLevel(product)
  const soldOut = level === 'out_of_stock'
  const image = product.images[0]

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <button
        type="button"
        onClick={() => toggleSaved(product.id)}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        aria-pressed={saved}
        className="absolute right-0 top-0 z-10 grid h-11 w-11 place-items-center transition-transform active:scale-90"
      >
        <Heart
          size={18}
          className={cn(
            'drop-shadow-glyph',
            saved ? 'fill-brand text-brand' : 'fill-white/30 text-white'
          )}
        />
      </button>
      <Link href={`/product/${product.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <div
          className={cn(
            'relative aspect-square overflow-hidden transition-colors',
            !image ? 'bg-brand-tint' : imageLoaded ? 'bg-white' : 'animate-pulse bg-line/50'
          )}
        >
          {image ? (
            <Image
              src={cldThumb(image, CARD_IMAGE_WIDTH)}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              className={cn(
                'object-cover transition-all duration-300 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-brand/35">
              {product.store === 'supermarket' ? (
                <ShoppingBasket size={44} strokeWidth={1.5} />
              ) : (
                <UtensilsCrossed size={44} strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {level !== 'in_stock' && <StockBadge level={level} className="self-start" />}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-body font-semibold text-ink"
        >
          {product.name}
        </Link>
        <StarRating rating={product.rating} />

        <span className="mt-1 text-lg font-bold text-brand">{formatNaira(product.price)}</span>

        <div className="mt-1.5">
          {soldOut ? (
            <button
              type="button"
              disabled
              className="h-11 w-full rounded-xl bg-line text-body font-semibold text-ink-muted"
            >
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={() => addItem(toCartItem(product, 1))}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-body font-semibold text-white transition-transform active:scale-95"
            >
              <Plus size={16} /> Add to Cart
            </button>
          ) : (
            <div className="flex h-11 items-center justify-between rounded-xl border border-brand">
              <button
                type="button"
                onClick={() => setQuantity(product.id, quantity - 1)}
                aria-label={`Remove one ${product.name}`}
                className="grid h-full w-11 place-items-center text-brand active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="text-body font-bold text-brand" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(product.id, quantity + 1)}
                disabled={quantity >= MAX_ITEM_QUANTITY}
                aria-label={`Add one more ${product.name}`}
                className="grid h-full w-11 place-items-center text-brand active:scale-90 disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
