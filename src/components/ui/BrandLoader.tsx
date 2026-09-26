import Image from 'next/image'
import { cn } from '@/lib/cn'

export function BrandPulse() {
  return (
    <div className="relative grid place-items-center">
      <span className="absolute h-20 w-20 animate-ping rounded-full bg-brand/15" />
      <Image
        src="/bellefood-glyph.png"
        alt="Loading"
        width={128}
        height={128}
        priority
        className="relative h-16 w-16 animate-logo-pulse"
      />
    </div>
  )
}

export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('grid min-h-[70svh] place-items-center', className)}>
      <BrandPulse />
    </div>
  )
}
