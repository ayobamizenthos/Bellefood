'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, UtensilsCrossed } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import { cldThumb } from '@/lib/image'
import { cn } from '@/lib/cn'

const ROTATE_MS = 5000
const MAX_SLIDES = 5
const SWIPE_THRESHOLD_PX = 40
const HERO_IMAGE_WIDTH = 1200

export function HeroCarousel({ products }: { products: Product[] }) {
  const slides = products.slice(0, MAX_SLIDES)
  const [selected, setSelected] = useState(0)
  const [rotation, setRotation] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const index = slides.length > 0 ? selected % slides.length : 0

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setSelected(current => (current + 1) % slides.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [slides.length, rotation])

  const showSlide = useCallback((next: number) => {
    setSelected(next)
    setRotation(count => count + 1)
  }, [])

  if (slides.length === 0) return null

  const step = (direction: 1 | -1) => showSlide((index + direction + slides.length) % slides.length)
  const current = slides[index]

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) step(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Bestsellers"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative h-60 select-none overflow-hidden rounded-3xl bg-brand-dark shadow-pop sm:h-72"
    >
      {current.images[0] ? (
        <Image
          key={current.id}
          src={cldThumb(current.images[0], HERO_IMAGE_WIDTH)}
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
          href={`/product/${current.slug}`}
          className="mt-1 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 text-body font-bold text-brand shadow-lg transition-transform active:scale-95"
        >
          Order Now <ArrowRight size={18} />
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="absolute right-2 top-2 flex">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => showSlide(slideIndex)}
              aria-label={`Show ${slide.name}`}
              aria-current={slideIndex === index}
              className="grid h-11 min-w-8 place-items-center"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  slideIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
