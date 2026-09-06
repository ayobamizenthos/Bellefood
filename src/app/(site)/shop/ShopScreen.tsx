'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from '@/lib/router'
import { Search, SlidersHorizontal, UtensilsCrossed, Store, X } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import type { ProductQuery } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductCard } from '@/components/product/ProductCard'
import { StorePromos } from '@/components/home/StorePromos'
import { cn } from '@/lib/cn'

const SORTS: { value: NonNullable<ProductQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ProductQuery['sort']>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const store = params.get('store') === 'supermarket' ? 'supermarket' : 'restaurant'
  const category = params.get('category') ?? undefined
  const { categories } = useCategories()
  const storeCategories = useMemo(
    () => categories.filter(c => c.store === store),
    [categories, store]
  )
  const { products, loading } = useProducts({
    store,
    category,
    search: search.trim() || undefined,
    sort,
  })

  const setStore = (next: 'restaurant' | 'supermarket') => {
    const p = new URLSearchParams(params)
    p.set('store', next)
    p.delete('category')
    setParams(p)
    setShowFilters(false)
  }

  const setCategory = (slug?: string) => {
    const p = new URLSearchParams(params)
    if (slug) p.set('category', slug)
    else p.delete('category')
    setParams(p)
    setShowFilters(false)
  }

  const activeLabel = useMemo(
    () =>
      storeCategories.find(c => c.slug === category)?.label ??
      (store === 'restaurant' ? 'All Meals' : 'All Products'),
    [storeCategories, category, store]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-1">
        <StoreTab active={store === 'restaurant'} onClick={() => setStore('restaurant')}>
          <UtensilsCrossed size={17} /> Kitchen
        </StoreTab>
        <StoreTab active={store === 'supermarket'} onClick={() => setStore('supermarket')}>
          <Store size={17} /> Supermarket
        </StoreTab>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={store === 'restaurant' ? 'Search meals…' : 'Search groceries…'}
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-body outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line"
          aria-label="Sort"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <FilterChip active={!category} onClick={() => setCategory(undefined)}>
          All
        </FilterChip>
        {storeCategories.map(c => (
          <FilterChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
            {c.label}
          </FilterChip>
        ))}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-3">
          <span className="text-body font-semibold">Sort:</span>
          {SORTS.map(s => (
            <FilterChip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      )}

      <h1 className="text-xl font-bold">{activeLabel}</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <X size={32} className="text-ink-muted" />
          <p className="font-semibold">Nothing here yet</p>
          <p className="text-body text-ink-muted">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <StorePromos />
    </div>
  )
}

function StoreTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl py-2.5 text-body font-semibold transition-colors',
        active ? 'bg-brand text-white shadow-card' : 'text-ink-muted hover:bg-line/50'
      )}
    >
      {children}
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-body font-medium transition-colors',
        active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
      )}
    >
      {children}
    </button>
  )
}
