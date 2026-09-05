import Image from 'next/image'
import { cn } from '@/lib/cn'

export function BrandLoader({ className }: { className?: string }) {
  return (
    <div className={cn('grid min-h-[55vh] place-items-center', className)}>
      <div className="relative grid place-items-center">
        <span className="absolute h-20 w-20 animate-ping rounded-2xl bg-brand/20" />
        <span className="absolute h-24 w-24 rounded-full bg-brand/5 blur-xl" />
        <Image
          src="/bellefood-mark.png"
          alt="Loading"
          width={64}
          height={64}
          priority
          className="relative h-16 w-16 animate-logo-pulse rounded-2xl shadow-pop"
        />
      </div>
    </div>
  )
}
