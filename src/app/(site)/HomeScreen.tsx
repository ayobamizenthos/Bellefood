'use client'

import { Link } from '@/lib/router'
import { ArrowRight, UtensilsCrossed, Store } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/product/ProductCard'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { StorePromos } from '@/components/home/StorePromos'
import type { Product } from '@/lib/types'

export default function HomePage() {
  const { products: featured, loading } = useProducts({ featuredOnly: true, sort: 'rating' })
  const { products: dishes } = useProducts({ store: 'restaurant', sort: 'rating' })
  const { products: groceries } = useProducts({ store: 'supermarket', sort: 'rating' })

  if (loading && featured.length === 0) return <HomeSkeleton />

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <HeroCarousel products={featured.length ? featured : dishes} />

      <section className="grid grid-cols-2 gap-3">
        <StoreCard
          to="/shop?store=restaurant"
          icon={<UtensilsCrossed size={20} />}
          title="Restaurant"
          subtitle="Hot meals, 24/7"
        />
        <StoreCard
          to="/shop?store=supermarket"
          icon={<Store size={20} />}
          title="Supermarket"
          subtitle="Groceries & more"
        />
      </section>

      <ProductRow
        title="Popular Dishes"
        href="/shop?store=restaurant"
        products={dishes.slice(0, 10)}
      />

      <ProductRow
        title="Supermarket Picks"
        href="/shop?store=supermarket"
        products={groceries.slice(0, 10)}
      />

      <StorePromos />
    </div>
  )
}

function StoreCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-card transition-colors hover:border-brand"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight">{title}</p>
        <p className="truncate text-[11px] text-ink-muted">{subtitle}</p>
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
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
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
      <div className="h-56 animate-pulse rounded-3xl bg-line/60 sm:h-72" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-2xl bg-line/60" />
        <div className="h-20 animate-pulse rounded-2xl bg-line/60" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-60 w-40 animate-pulse rounded-2xl bg-line/60 sm:w-48" />
        ))}
      </div>
    </div>
  )
}
