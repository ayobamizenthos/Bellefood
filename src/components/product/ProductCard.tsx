'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/lib/router'
import { Heart, Minus, Plus, UtensilsCrossed, ShoppingBasket } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cartItemKey } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cn } from '@/lib/cn'
import { StarRating } from '@/components/ui/StarRating'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { useCart } from '@/stores/cart'
import { useWishlist } from '@/stores/wishlist'

export function ProductCard({ product }: { product: Product }) {
  const items = useCart(s => s.items)
  const addItem = useCart(s => s.addItem)
  const setQuantity = useCart(s => s.setQuantity)
  const { has, toggle } = useWishlist()
  const [imageLoaded, setImageLoaded] = useState(false)

  const level = stockLevel(product)
  const soldOut = level === 'out_of_stock'
  const saved = has(product.id)

  const key = `p:${product.id}`
  const inCart = items.find(item => cartItemKey(item) === key)
  const quantity = inCart && inCart.kind === 'product' ? inCart.quantity : 0

  const add = () =>
    addItem({
      kind: 'product',
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? null,
      category: product.category,
      isCombo: product.is_combo,
      unitPrice: product.price,
      quantity: 1,
    })

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        className="absolute right-0 top-0 z-10 grid h-11 w-11 place-items-center transition-transform active:scale-90"
      >
        <Heart
          size={18}
          className={cn(
            'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
            saved ? 'fill-brand text-brand' : 'fill-white/30 text-white'
          )}
        />
      </button>
      <Link to={`/product/${product.slug}`} className="block">
        <div
          className={cn(
            'relative aspect-square overflow-hidden transition-colors',
            !product.images[0]
              ? 'bg-brand-tint'
              : imageLoaded
                ? 'bg-white'
                : 'animate-pulse bg-line/50'
          )}
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
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
          to={`/product/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-body font-semibold text-ink"
        >
          {product.name}
        </Link>
        <StarRating rating={product.rating} />

        <span className="mt-1 text-lg font-bold text-brand">
          {formatNaira(product.price)}
        </span>

        <div className="mt-1.5">
          {soldOut ? (
            <button
              type="button"
              disabled
              className="h-10 w-full rounded-xl bg-line text-body font-semibold text-ink-muted"
            >
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={add}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-body font-semibold text-white transition-transform active:scale-95"
            >
              <Plus size={16} /> Add to Cart
            </button>
          ) : (
            <div className="flex h-10 items-center justify-between rounded-xl border border-brand">
              <button
                type="button"
                onClick={() => setQuantity(key, quantity - 1)}
                aria-label="Decrease quantity"
                className="grid h-full w-11 place-items-center text-brand active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="text-body font-bold text-brand">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(key, quantity + 1)}
                aria-label="Increase quantity"
                className="grid h-full w-11 place-items-center text-brand active:scale-90"
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
