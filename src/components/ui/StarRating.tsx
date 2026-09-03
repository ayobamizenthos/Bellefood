import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= Math.round(rating) ? 'fill-brand text-brand' : 'fill-line text-line'
          )}
        />
      ))}
    </div>
  )
}
