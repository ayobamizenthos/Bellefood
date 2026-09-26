'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, SearchX, SlidersHorizontal } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import type { ProductSort } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ProductCard } from '@/components/product/ProductCard'
import { StorePromos } from '@/components/home/StorePromos'
import { Chip } from '@/components/ui/Chip'
import type { StoreKind } from '@/lib/types'
import { SegmentTab } from '@/components/ui/SegmentTab'

const SEARCH_DEBOUNCE_MS = 300
const SKELETON_CARDS = 8

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const parseStore = (value: string | null): StoreKind | undefined =>
  value === 'restaurant' || value === 'supermarket' ? value : undefined

export default function ShopScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [sort, setSort] = useState<ProductSort>('newest')
  const [showSort, setShowSort] = useState(false)
  const searchTerm = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const requestedStore = parseStore(params.get('store'))
  // A search from the home page covers both stores until a tab is picked.
  const store = requestedStore ?? (searchTerm ? undefined : 'restaurant')
  const category = store ? (params.get('category') ?? undefined) : undefined
  const { categories } = useCategories()
  const storeCategories = useMemo(
    () => categories.filter(entry => entry.store === store),
    [categories, store]
  )
  const { products, loading } = useProducts({
    store,
    category,
    search: searchTerm || undefined,
    sort,
  })

  const updateParams = (apply: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString())
    apply(next)
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const selectStore = (next: StoreKind) =>
    updateParams(query => {
      query.set('store', next)
      query.delete('category')
    })

  const selectCategory = (slug?: string) =>
    updateParams(query => {
      if (slug) query.set('category', slug)
      else query.delete('category')
    })

  const heading = !store
    ? 'Search results'
    : (storeCategories.find(entry => entry.slug === category)?.label ??
      (store === 'restaurant' ? 'All Meals' : 'All Products'))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-1">
        <SegmentTab active={store === 'restaurant'} onSelect={() => selectStore('restaurant')}>
          Meals
        </SegmentTab>
        <SegmentTab active={store === 'supermarket'} onSelect={() => selectStore('supermarket')}>
          Mart
        </SegmentTab>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={store === 'supermarket' ? 'Search groceries…' : 'Search meals…'}
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-body outline-none focus:border-brand"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowSort(open => !open)}
          aria-expanded={showSort}
          aria-label="Sort products"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {store && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <Chip active={!category} onClick={() => selectCategory(undefined)}>
            All
          </Chip>
          {storeCategories.map(entry => (
            <Chip key={entry.slug} active={category === entry.slug} onClick={() => selectCategory(entry.slug)}>
              {entry.label}
            </Chip>
          ))}
        </div>
      )}

      {showSort && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white p-3">
          <span className="text-body font-semibold">Sort:</span>
          {SORTS.map(option => (
            <Chip key={option.value} active={sort === option.value} onClick={() => setSort(option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      <h1 className="text-xl font-bold">{heading}</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <SearchX size={32} className="text-ink-muted" />
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
