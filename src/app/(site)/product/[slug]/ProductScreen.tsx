'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingBasket,
  UtensilsCrossed,
} from 'lucide-react'
import { useShareProduct } from '@/hooks/useShareProduct'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { formatNaira } from '@/lib/format'
import type { Product } from '@/lib/types'
import { MAX_ITEM_QUANTITY, toCartItem } from '@/lib/types'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { ProductCard } from '@/components/product/ProductCard'
import { useCart } from '@/stores/cart'
import { useWishlist } from '@/stores/wishlist'

const ADDED_FEEDBACK_MS = 1600
const GALLERY_IMAGE_WIDTH = 1000
const THUMBNAIL_WIDTH = 128

export default function ProductScreen({ initialProduct }: { initialProduct: Product }) {
  const { product: fetched } = useProduct(initialProduct.slug)
  const product = fetched ?? initialProduct
  const { products: related } = useProducts({
    store: product.store,
    category: product.category,
    sort: 'rating',
  })
  const addItem = useCart(state => state.addItem)
  const saved = useWishlist(state => state.ids.includes(product.id))
  const toggleSaved = useWishlist(state => state.toggle)
  const share = useShareProduct()

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [descOpen, setDescOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const anchor = ctaRef.current
    if (!anchor) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(anchor)
    return () => observer.disconnect()
  }, [product])

  const isSupermarket = product.store === 'supermarket'
  const soldOut = stockLevel(product) === 'out_of_stock'
  const images = product.images
  const suggestions = related.filter(item => item.id !== product.id).slice(0, 8)
  const lineTotal = formatNaira(product.price * quantity)

  const syncActiveImage = () => {
    const track = trackRef.current
    if (!track) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    setActiveImage(prev => (prev === index ? prev : index))
  }

  const scrollToImage = (index: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  const addToCart = () => {
    addItem(toCartItem(product, quantity))
    setAdded(true)
    setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div
              ref={trackRef}
              onScroll={syncActiveImage}
              className={cn(
                'no-scrollbar flex aspect-square overflow-x-auto rounded-3xl border border-line bg-white',
                images.length > 1 && 'snap-x snap-mandatory'
              )}
            >
              {images.length > 0 ? (
                images.map((img, i) => (
                  <div key={i} className="relative aspect-square w-full shrink-0 snap-center">
                    <Image
                      src={cldThumb(img, GALLERY_IMAGE_WIDTH)}
                      alt={i === 0 ? product.name : ''}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={i === 0}
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="grid aspect-square w-full shrink-0 place-items-center bg-brand-tint text-brand/35">
                  {isSupermarket ? (
                    <ShoppingBasket size={72} strokeWidth={1.5} />
                  ) : (
                    <UtensilsCrossed size={72} strokeWidth={1.5} />
                  )}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full shadow-sm transition-all',
                      i === activeImage ? 'w-5 bg-white' : 'w-1.5 bg-white/70'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white',
                    i === activeImage ? 'border-brand' : 'border-line'
                  )}
                >
                  <Image src={cldThumb(img, THUMBNAIL_WIDTH)} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSaved(product.id)}
                aria-label={saved ? 'Remove from saved' : 'Save for later'}
                aria-pressed={saved}
                className="grid h-11 w-11 place-items-center rounded-full border border-line transition-transform active:scale-90"
              >
                <Heart size={19} className={cn('text-brand', saved && 'fill-brand')} />
              </button>
              <button
                type="button"
                onClick={() => share(product)}
                aria-label="Share this item"
                className="grid h-11 w-11 place-items-center rounded-full border border-line transition-transform active:scale-90"
              >
                <Share2 size={18} className="text-brand" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StarRating rating={product.rating} size={16} />
            {soldOut && <StockBadge level="out_of_stock" />}
          </div>

          <p className="text-3xl font-bold text-brand">{formatNaira(product.price)}</p>

          {product.description && (
            <div>
              <p
                className={cn(
                  'text-body leading-relaxed text-ink-muted',
                  !descOpen && 'line-clamp-2'
                )}
              >
                {product.description}
              </p>
              <button
                type="button"
                onClick={() => setDescOpen(open => !open)}
                aria-expanded={descOpen}
                className="mt-1 flex min-h-[44px] items-center gap-1 text-body font-semibold text-brand"
              >
                {descOpen ? 'Show less' : 'Read more'}
                <ChevronDown
                  size={15}
                  className={cn('transition-transform', descOpen && 'rotate-180')}
                />
              </button>
            </div>
          )}

          <div ref={ctaRef} className="flex flex-col gap-3">
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-body font-semibold">Quantity</span>
              <div className="flex h-11 items-center rounded-xl border border-brand">
                <button
                  type="button"
                  onClick={() => setQuantity(current => Math.max(1, current - 1))}
                  className="grid h-full w-11 place-items-center text-brand active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus size={17} />
                </button>
                <span className="w-10 text-center text-body font-bold text-brand">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(current => Math.min(MAX_ITEM_QUANTITY, current + 1))}
                  disabled={quantity >= MAX_ITEM_QUANTITY}
                  className="grid h-full w-11 place-items-center text-brand active:scale-90 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>

            <Button size="lg" fullWidth onClick={addToCart} disabled={soldOut} className="mt-1">
              {added ? (
                <>
                  <Check size={18} /> Added to Cart
                </>
              ) : soldOut ? (
                'Out of Stock'
              ) : (
                `Add to Cart · ${lineTotal}`
              )}
            </Button>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">You might also like</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {suggestions.map(item => (
              <div key={item.id} className="w-40 shrink-0 sm:w-48">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {showStickyCta && !soldOut && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 animate-slide-up border-t border-line bg-white/95 px-4 py-3 shadow-lift backdrop-blur md:bottom-0">
          <div className="mx-auto flex max-w-app items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold">{product.name}</p>
              <p className="text-body font-bold text-brand">{lineTotal}</p>
            </div>
            <Button size="lg" onClick={addToCart} className="shrink-0 px-6">
              {added ? (
                <>
                  <Check size={18} /> Added
                </>
              ) : (
                'Add to Cart'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
