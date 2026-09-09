import Image from 'next/image'
import { cn } from '@/lib/cn'

export function BrandLoader({ className }: { className?: string }) {
  return (
    <div className={cn('grid min-h-[70vh] place-items-center', className)}>
      <div className="relative grid place-items-center">
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-brand/15" />
        <span className="absolute h-24 w-24 rounded-full bg-brand/5 blur-xl" />
        <Image
          src="/bellefood-glyph.png"
          alt="Loading"
          width={128}
          height={128}
          priority
          className="relative h-16 w-16 animate-logo-pulse"
        />
      </div>
    </div>
  )
}
