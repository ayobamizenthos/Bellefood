'use client'

import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clock, Search, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ProductCard } from '@/components/product/ProductCard'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { StorePromos } from '@/components/home/StorePromos'
import type { Product, StoreKind } from '@/lib/types'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'

const ROW_SIZE = 10
const HERO_SIZE = 5
const SUGGESTION_COUNT = 6
const MIN_SEARCH_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 250
const BLUR_GRACE_MS = 120

export default function HomeScreen() {
  const { products: featured, loading } = useProducts({ featuredOnly: true, sort: 'rating', limit: HERO_SIZE })
  const { products: dishes } = useProducts({ store: 'restaurant', sort: 'rating', limit: ROW_SIZE })
  const { products: groceries } = useProducts({ store: 'supermarket', sort: 'rating', limit: ROW_SIZE })
  const { categories } = useCategories()
  const kitchenCategories = categories.filter(category => category.store === 'restaurant')

  if (loading && featured.length === 0) return <HomeSkeleton />

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <HomeSearch />
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
                href={`/shop?store=restaurant&category=${category.slug}`}
                className="flex min-h-[44px] shrink-0 items-center rounded-full border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow title="Bestsellers" href="/shop?store=restaurant" products={dishes} />
      <ProductRow title="Mart Picks" href="/shop?store=supermarket" products={groceries} />

      <StorePromos />
    </div>
  )
}

function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>()
  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const searching = term.length >= MIN_SEARCH_LENGTH
  const { products: matches } = useProducts({
    search: term,
    limit: SUGGESTION_COUNT,
    sort: 'rating',
    enabled: searching,
  })
  const suggestions = searching ? matches : []

  const goToResults = (searchTerm: string, store?: StoreKind) => {
    const params = new URLSearchParams()
    if (store) params.set('store', store)
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    router.push(`/shop?${params.toString()}`)
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    goToResults(query)
  }

  const showDropdown = focused && suggestions.length > 0

  return (
    <div className="relative">
      <form onSubmit={submitSearch} role="search" className="relative">
        <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), BLUR_GRACE_MS)
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
                onClick={() => goToResults(product.name, product.store === 'supermarket' ? 'supermarket' : 'restaurant')}
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
                  <span className="block text-label text-ink-muted">
                    {product.store === 'supermarket' ? 'Mart' : 'Meals'}
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
      <span aria-hidden className="text-line">
        •
      </span>
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
  store: StoreKind
  eyebrow: string
  title: string
  subtitle: string
  image?: string | null
  fallback: ReactNode
  dark?: boolean
}) {
  return (
    <Link
      href={`/shop?store=${store}`}
      className={cn(
        'relative flex items-center gap-3 overflow-hidden rounded-3xl p-5 text-white shadow-pop transition-transform active:scale-[0.99]',
        dark ? 'bg-gradient-to-br from-charcoal to-charcoal-deep' : 'bg-gradient-to-br from-brand to-brand-dark'
      )}
    >
      <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/5" />
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-bold leading-none text-white">{title}</h3>
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
          href={href}
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
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-60 w-40 animate-pulse rounded-2xl bg-line/60 sm:w-48" />
        ))}
      </div>
    </div>
  )
}
