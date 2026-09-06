'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useNavigate, useParams } from '@/lib/router'
import {
  ArrowLeft,
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
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { StockBadge, stockLevel } from '@/components/ui/StockBadge'
import { ProductCard } from '@/components/product/ProductCard'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { useCart } from '@/stores/cart'
import { useWishlist } from '@/stores/wishlist'

export default function ProductPage({ initialProduct }: { initialProduct?: Product }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { product: fetched, loading } = useProduct(slug)
  const product = fetched ?? initialProduct ?? null
  const { products: related } = useProducts({
    store: product?.store,
    category: product?.category,
    sort: 'rating',
  })
  const addItem = useCart(s => s.addItem)
  const { has, toggle } = useWishlist()
  const share = useShareProduct()

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [descOpen, setDescOpen] = useState(false)
  const [added, setAdded] = useState(false)

  if (loading && !initialProduct) return <PageSpinner />
  if (!product) return <p className="py-16 text-center">Item not found.</p>

  const level = stockLevel(product)
  const soldOut = level === 'out_of_stock'
  const saved = has(product.id)
  const hasImage = Boolean(product.images[activeImage])
  const suggestions = related.filter(item => item.id !== product.id).slice(0, 8)

  const handleAdd = () => {
    addItem({
      kind: 'product',
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? null,
      category: product.category,
      isCombo: product.is_combo,
      unitPrice: product.price,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-brand-tint">
            {hasImage ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain p-3"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-brand/35">
                {product.store === 'supermarket' ? (
                  <ShoppingBasket size={72} strokeWidth={1.5} />
                ) : (
                  <UtensilsCrossed size={72} strokeWidth={1.5} />
                )}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                    i === activeImage ? 'border-brand' : 'border-line'
                  )}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-body font-medium capitalize text-ink-muted">
            {product.store === 'supermarket' ? 'Supermarket' : 'Kitchen'}
          </span>
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
          <div className="flex items-center gap-3">
            <StarRating rating={product.rating} size={16} />
            <StockBadge level={level} />
          </div>

          <p className="text-3xl font-bold text-brand">{formatNaira(product.price)}</p>

          {product.description && (
            <div>
              <p className={cn('text-body text-ink-muted', !descOpen && 'line-clamp-2')}>
                {product.description}
              </p>
              <button
                onClick={() => setDescOpen(v => !v)}
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

          <div className="flex items-center gap-3">
            <span className="text-body font-semibold">Quantity</span>
            <div className="flex items-center rounded-xl border border-line">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center"
                aria-label="Decrease"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="grid h-10 w-10 place-items-center"
                aria-label="Increase"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <Button size="lg" fullWidth onClick={handleAdd} disabled={soldOut}>
              {added ? 'Added ✓' : soldOut ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <button
              type="button"
              onClick={() => toggle(product.id)}
              aria-label={saved ? 'Remove from saved' : 'Save for later'}
              className="grid h-[52px] w-[52px] shrink-0 place-items-center transition-transform active:scale-90"
            >
              <Heart size={34} strokeWidth={2} className={cn('text-brand', saved && 'fill-brand')} />
            </button>
            <button
              type="button"
              onClick={() => share(product)}
              aria-label="Share this item"
              className="grid h-[52px] w-[52px] shrink-0 place-items-center transition-transform active:scale-90"
            >
              <Share2 size={30} strokeWidth={2} className="text-brand" />
            </button>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">You might also like</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {suggestions.map(item => (
              <div key={item.id} className="w-40 shrink-0 sm:w-48">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => navigate(-1)}
        className="inline-flex min-h-[44px] w-fit items-center gap-1.5 text-body font-semibold text-brand"
      >
        <ArrowLeft size={18} /> Back
      </button>
    </div>
  )
}
