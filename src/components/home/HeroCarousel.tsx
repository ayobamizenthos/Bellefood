'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Link } from '@/lib/router'
import { ArrowRight, UtensilsCrossed } from 'lucide-react'
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
      className="relative h-60 select-none overflow-hidden rounded-3xl bg-brand-dark shadow-pop sm:h-72"
    >
      {current.images[0] ? (
        <Image
          key={current.id}
          src={current.images[0]}
          alt={current.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          className="animate-fade-in object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-white/30">
          <UtensilsCrossed size={72} strokeWidth={1.5} />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-5">
        <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
          Bestseller
        </span>
        <h2 className="line-clamp-2 text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
          {current.name}
        </h2>
        <p className="text-xl font-bold text-white">{formatNaira(current.price)}</p>
        <Link
          to={`/product/${current.slug}`}
          className="mt-1 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 text-body font-bold text-brand shadow-lg transition-transform active:scale-95"
        >
          Order Now <ArrowRight size={18} />
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="absolute right-4 top-4 flex gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
