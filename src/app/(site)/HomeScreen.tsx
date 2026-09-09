'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Link, useNavigate } from '@/lib/router'
import { ArrowRight, Clock, Search, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductCard } from '@/components/product/ProductCard'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { StorePromos } from '@/components/home/StorePromos'
import type { Product } from '@/lib/types'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'

export default function HomePage() {
  const { products: featured, loading } = useProducts({ featuredOnly: true, sort: 'rating' })
  const { products: dishes } = useProducts({ store: 'restaurant', sort: 'rating' })
  const { products: groceries } = useProducts({ store: 'supermarket', sort: 'rating' })
  const { categories } = useCategories()
  const kitchenCategories = categories.filter(category => category.store === 'restaurant')

  if (loading && featured.length === 0) return <HomeSkeleton />

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <HomeSearch catalog={[...dishes, ...groceries]} />
        <TrustRibbon />
      </div>

      <HeroCarousel products={featured.length ? featured : dishes} />

      <div className="flex flex-col gap-3">
        <StoreTile
          store="restaurant"
          eyebrow="Order food"
          title="Meals"
          subtitle="Freshly cooked meals, made to order"
          image={dishes[0]?.images[0]}
          fallback={<UtensilsCrossed size={38} strokeWidth={1.5} />}
        />
        <StoreTile
          store="supermarket"
          eyebrow="Shop groceries"
          title="Mart"
          subtitle="Everyday essentials, delivered"
          image={groceries[0]?.images[0]}
          fallback={<ShoppingBasket size={38} strokeWidth={1.5} />}
          dark
        />
      </div>

      {kitchenCategories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Explore the menu</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {kitchenCategories.map(category => (
              <Link
                key={category.slug}
                to={`/shop?store=restaurant&category=${category.slug}`}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow title="Bestsellers" href="/shop?store=restaurant" products={dishes.slice(0, 10)} />
      <ProductRow title="Mart Picks" href="/shop?store=supermarket" products={groceries.slice(0, 10)} />

      <StorePromos />
    </div>
  )
}

function HomeSearch({ catalog }: { catalog: Product[] }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>()

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    const seen = new Set<string>()
    return catalog
      .filter(product => {
        if (seen.has(product.id) || !product.name.toLowerCase().includes(needle)) return false
        seen.add(product.id)
        return true
      })
      .slice(0, 6)
  }, [catalog, query])

  const goToResults = (term: string, store?: Product['store']) => {
    const trimmed = term.trim()
    const params = new URLSearchParams()
    if (store) params.set('store', store)
    if (trimmed) params.set('q', trimmed)
    navigate(`/shop?${params.toString()}`)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    goToResults(query, 'restaurant')
  }

  const showDropdown = focused && suggestions.length > 0

  return (
    <div className="relative">
      <form onSubmit={submit} className="relative">
        <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 120)
          }}
          placeholder="Search meals, drinks, groceries…"
          aria-label="Search Belle Food"
          className={cn(
            'h-12 w-full border border-line bg-white pl-11 pr-4 text-body shadow-card outline-none placeholder:text-ink-muted focus:border-brand',
            showDropdown ? 'rounded-t-2xl border-b-transparent' : 'rounded-2xl'
          )}
        />
      </form>

      {showDropdown && (
        <ul
          onMouseDown={() => clearTimeout(blurTimer.current)}
          className="absolute inset-x-0 top-full z-30 overflow-hidden rounded-b-2xl border border-t-0 border-brand bg-white shadow-pop"
        >
          {suggestions.map(product => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => goToResults(product.name, product.store)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-tint"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-line/40">
                  {product.images[0] ? (
                    <Image
                      src={cldThumb(product.images[0], 120)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Search size={16} className="text-ink-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ink">{product.name}</span>
                  <span className="block text-label capitalize text-ink-muted">
                    {product.store === 'restaurant' ? 'Meals' : 'Mart'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TrustRibbon() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] font-medium text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <Clock size={13} className="text-brand" /> Open 24/7
      </span>
      <span className="text-line">•</span>
      <span className="inline-flex items-center gap-1">
        <ShoppingBasket size={13} className="text-brand" /> Delivery or Pickup
      </span>
    </div>
  )
}

function StoreTile({
  store,
  eyebrow,
  title,
  subtitle,
  image,
  fallback,
  dark,
}: {
  store: 'restaurant' | 'supermarket'
  eyebrow: string
  title: string
  subtitle: string
  image?: string | null
  fallback: React.ReactNode
  dark?: boolean
}) {
  return (
    <Link
      to={`/shop?store=${store}`}
      className={cn(
        'relative flex items-center gap-3 overflow-hidden rounded-3xl p-5 text-white shadow-pop transition-transform active:scale-[0.99]',
        dark
          ? 'bg-gradient-to-br from-[#262626] to-[#0d0d0d]'
          : 'bg-gradient-to-br from-brand to-brand-dark'
      )}
    >
      <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/5" />
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-bold leading-none">{title}</h3>
        <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold backdrop-blur">
          Explore <ArrowRight size={15} />
        </span>
      </div>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-xl ring-4 ring-white/10">
        {image ? (
          <Image src={cldThumb(image, 240)} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <div className={cn('grid h-full w-full place-items-center', dark ? 'text-ink/30' : 'text-brand/40')}>
            {fallback}
          </div>
        )}
      </div>
    </Link>
  )
}

function ProductRow({ title, href, products }: { title: string; href: string; products: Product[] }) {
  if (products.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link
          to={href}
          className="-my-2 flex min-h-[44px] items-center gap-1 text-body font-semibold text-brand"
        >
          View all <ArrowRight size={16} />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {products.map(product => (
          <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-12 animate-pulse rounded-2xl bg-line/60" />
      <div className="h-60 animate-pulse rounded-3xl bg-line/60 sm:h-72" />
      <div className="flex flex-col gap-3">
        <div className="h-28 animate-pulse rounded-3xl bg-line/60" />
        <div className="h-28 animate-pulse rounded-3xl bg-line/60" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-60 w-40 animate-pulse rounded-2xl bg-line/60 sm:w-48" />
        ))}
      </div>
    </div>
  )
}
