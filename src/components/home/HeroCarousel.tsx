'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Link } from '@/lib/router'
import { ArrowRight, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cn } from '@/lib/cn'

const ROTATE_MS = 5000

export function HeroCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const slides = products.slice(0, 5)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null

  const go = (dir: 1 | -1) => setIndex(i => (i + dir + slides.length) % slides.length)
  const current = slides[index]

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative select-none overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-dark text-white shadow-pop"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 p-6 sm:gap-8 sm:p-8">
        <div className="flex flex-col gap-2.5 pb-6">
          <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
            Bestseller
          </span>
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-2xl">
            {current.name}
          </h2>
          <p className="text-2xl font-bold text-white sm:text-3xl">
            {formatNaira(current.price)}
          </p>
          <Link
            to={`/product/${current.slug}`}
            className="mt-2 inline-flex h-11 w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 text-body font-semibold text-brand shadow-lg transition-transform active:scale-95"
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>

        <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-white shadow-xl ring-4 ring-white/10 sm:h-48 sm:w-48">
          {current.images[0] ? (
            <Image
              key={current.id}
              src={current.images[0]}
              alt={current.name}
              fill
              sizes="192px"
              priority
              className="animate-fade-in object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-brand/30">
              {current.store === 'supermarket' ? (
                <ShoppingBasket size={64} strokeWidth={1.5} />
              ) : (
                <UtensilsCrossed size={64} strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
